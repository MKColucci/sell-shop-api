import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/services/prisma-service/prisma.service';
import { genSaltSync, hash } from 'bcrypt';
import { ResponseUserDto } from './dto/response-user.dto';

type Attendant = {
  id: string;
  username: string;
};

type AttendantsGroupedBySchedule = {
  schedule_id: string;
  attendants: Attendant[];
  attendants_count: number;
};

type HourRow = { hour: string; count_avaible_spaces: number; have_space: boolean; attendants: Attendant[] };
type DayRow = { date: string; have_space: boolean; hours: HourRow[]; total_available_slots: number };

type HourCountPerService = { service_type_id: string; count: number; attendant_id: string[] };
type HourCountPerBranch = { branch_id: string; count: number };
type PeriodCountPerService = { service_type_id: string; morning_count: number; evening_count: number; night_count: number };

type DayRowAppointments = {
  date: string; // "dd/MM/yyyy"
  hours_have_appointment: {
    hour: string; // "HH:mm"
    count_per_service: HourCountPerService[];
    count_per_branch: HourCountPerBranch[];
  }[];
  count_per_period_service: PeriodCountPerService[];
};

type HourAgg = {
  perService: Map<string, { count: number; attendants: Set<string> }>;
  perBranch: Map<string, number>;
};
type DayAgg = {
  hours: Map<string, HourAgg>; // "HH:mm" -> HourAgg
  periodByService: Map<string, { morning: number; evening: number; night: number }>;
};

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  formatHour = (t: unknown): string => {
    if (t == null) return "";
    if (t instanceof Date) {
      const hh = String(t.getUTCHours()).padStart(2, "0");
      const mm = String(t.getUTCMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    }
    const s = String(t).trim();
    const mIso = s.match(/T(\d{2}):(\d{2})/);
    if (mIso) return `${mIso[1]}:${mIso[2]}`;
    const mHm = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (mHm) return `${mHm[1].padStart(2, "0")}:${mHm[2]}`;
    const ts = Date.parse(s);
    if (!Number.isNaN(ts)) {
      const d = new Date(ts);
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mm = String(d.getUTCMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    }
    return "";
  };

  formatDateBR = (d: Date): string => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  };

  getMonthRange(year: number, month: number) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JS é 0–11

    let start: Date;
    let end: Date;

    if (year === currentYear && month === currentMonth) {
      // mês/ano atuais → começa hoje
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
    } else {
      // outro mês → começa no dia 1
      start = new Date(year, month - 1, 1);
      start.setHours(0, 0, 0, 0);
    }

    // último dia do mês às 23:59:59
    end = new Date(year, month, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  generateDefaultTimes(
    start: string = "00:00",
    end: string = "23:59",
    interval: number = 1
  ): { time: string; active: boolean }[] {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000; // ajuste do timezone local (minutos → ms)
    const today = new Date(now.getTime() - tzOffset); // corrige para hora local

    // Converter start para Date
    const [startHour, startMinute] = start.split(":").map(Number);
    const startDt = new Date(today);
    startDt.setHours(startHour, startMinute, 0, 0);

    // Converter end para Date
    const [endHour, endMinute] = end.split(":").map(Number);
    const endDt = new Date(today);
    endDt.setHours(endHour, endMinute, 0, 0);

    // Se start for antes de agora, começa agora
    let effectiveStart = startDt < now ? now : startDt;

    const times: { time: string; active: boolean }[] = [];

    for (
      let current = new Date(effectiveStart);
      current <= endDt;
      current = new Date(current.getTime() + interval * 60000)
    ) {
      const hh = String(current.getHours()).padStart(2, "0");
      const mm = String(current.getMinutes()).padStart(2, "0");
      times.push({ time: `${hh}:${mm}`, active: true });
    }

    return times;
  }

  async getAvaibleSlotsInMonth() {
    /* 
    regras de negocio:
    para um horario estar disponivel 
      - caso o service_type disregarded = false
          *SLOTS POR HORARIO*
        - verificar se algum atendente possui na agenda de horario, disponibilidade para o horario especifico (fazer um count para saber os slots disponiveis)
        - levar em conta o limite da branch ou quantidade de atendentes disponiveis para aquele tipo de serviço, slots é o menor valor entre esses
        - verificar a quantidade de appointments na data/hora e subtrair da quantidade de slots
        - se slots == 0 então horario indisponivel
      - caso service_type disregarded = false e possui (morningLimit > 0 && morningLimit) || (eveningLimit > 0 && eveningLimit) || (nightLimit > 0 && nightLimit)
        - verificar se algum atendente possui na agenda de horario, disponibilidade para o horario especifico (fazer um count para saber os slots disponiveis)
        - pegar limite do periodo, limite da branch e slots atuais, slots é o menor valor entre esses
        - verificar a quantidade de appointments no periodo e subtrair da quantidade de slots
        - se slots == 0 então periodo indisponivel
      - case service_type disregarded = true
        - sempre disponivel retornar 99+
    */

    //Pegar todos os appointments no período - ok
    //pegar info da branch - ok
    //Pegar todos os atendentes e seus horarios - ok
    //buscar as informações do service_type - ok
    //Unificar os horarios iguais no seguinte objeto => {scheduleId: "uuid", attendantsId: ["uuid", "uuid"], hour: [{}]} - ok
    //verificar se service_type disregarded é true ou false - ok
    //se true => retorna todos os horarios com slots 99
    //se false => verifica os limits do service_type
    //se morningLimit > 0 => pega os appointments com aquele service_type_id no periodo das 00:00 até as 11:59, verifica disponibilidade de attendants e limits da branch, retorna slots por horario se limite foi atingido no periodo remover todos os horários do periodo
    //se eveningLimit > 0 => pega os appointments com aquele service_type_id no periodo das 12:00 até as 17:59, verifica disponibilidade de attendants e limits da branch, retorna slots por horario se limite foi atingido no periodo remover todos os horários do periodo
    //se nightLimit > 0 => pega os appointments com aquele service_type_id no periodo das 18:00 até as 23:59, verifica disponibilidade de attendants e limits da branch, retorna slots por horario se limite foi atingido no periodo remover todos os horários do periodo
    //se não tiver nenhum limit por periodo => verifica atendentes disponiveis para o horario, limite de branch e quantidade de appointments para o horario, retorna slots por horario
    //se o dia for o atual retornar a partir da hora atual até 23:59 de 1 em 1 minuto com slots 99

    const branchId = "81f90670-edc6-49ff-b4ef-2a380bd07cf1"
    const serviceTypeId = "10f04803-4166-46d1-8cab-817a928a3fa9"
    const attendantId = "2c115dfc-6648-42b6-b70b-324a6aa30f9d"
    const month = 11
    const year = 2025

    const { end, start } = this.getMonthRange(year, month)

    const appointments = await this.prisma.appointments.findMany({
      where: {
        date: { lte: end, gte: start },
        status: { notIn: ["CANCELADO", 'REMARCADO'] },
        service_types: {
          disregarded: false
        }
      }
    })

    // === agregação por dia/hora/serviço/filial ===
    const TZ = "America/Sao_Paulo";
    const dateFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ }); // dd/MM/yyyy
    const timeFmt = new Intl.DateTimeFormat("pt-BR", {
      timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false
    }); // HH:mm

    // periodização: manhã [06–11], tarde [12–17], noite [18–23] (00–05 fora do horário comercial, jogamos em manhã se quiser)
    const periodOf = (hh: number): "morning" | "evening" | "night" => {
      if (hh >= 6 && hh <= 11) return "morning";
      if (hh >= 12 && hh <= 17) return "evening";
      return "night";
    };

    // 1) index por dia
    const perDate = new Map<string, DayAgg>();

    for (const ap of appointments ?? []) {
      const d: Date = ap.date instanceof Date ? ap.date : new Date(ap.date);
      if (isNaN(d.getTime())) continue;

      const dateStr = dateFmt.format(d);        // "dd/MM/yyyy"
      const hourStr = timeFmt.format(d);        // "HH:mm"
      const hh = Number(hourStr.slice(0, 2)) || 0;
      const p = periodOf(hh);

      const sid = String(ap.service_type_id ?? "");
      const bid = ap.branch_id != null ? String(ap.branch_id) : undefined;
      const aid = ap.attendant_id != null ? String(ap.attendant_id) : undefined;
      if (!sid) continue; // precisa do service_type_id p/ os agrupamentos

      // pega agg do dia
      if (!perDate.has(dateStr)) {
        perDate.set(dateStr, {
          hours: new Map<string, HourAgg>(),
          periodByService: new Map(),
        });
      }
      const dayAgg = perDate.get(dateStr)!;

      // agg por hora
      if (!dayAgg.hours.has(hourStr)) {
        dayAgg.hours.set(hourStr, {
          perService: new Map(),
          perBranch: new Map(),
        });
      }
      const hAgg = dayAgg.hours.get(hourStr)!;

      // service aggregation (count + attendants únicos)
      if (!hAgg.perService.has(sid)) {
        hAgg.perService.set(sid, { count: 0, attendants: new Set<string>() });
      }
      const svc = hAgg.perService.get(sid)!;
      svc.count += 1;
      if (aid) svc.attendants.add(aid);

      // branch aggregation
      if (bid) hAgg.perBranch.set(bid, (hAgg.perBranch.get(bid) ?? 0) + 1);

      // period aggregation por service no dia
      if (!dayAgg.periodByService.has(sid)) {
        dayAgg.periodByService.set(sid, { morning: 0, evening: 0, night: 0 });
      }
      const per = dayAgg.periodByService.get(sid)!;
      if (p === "morning") per.morning += 1;
      else if (p === "evening") per.evening += 1;
      else per.night += 1;
    }

    // 2) monta o resultado no formato solicitado
    const result: DayRowAppointments[] = Array.from(perDate.entries())
      // opcional: ordena por data crescente (dd/MM/yyyy -> Date)
      .sort(([a], [b]) => {
        const [da, ma, ya] = a.split("/").map(Number);
        const [db, mb, yb] = b.split("/").map(Number);
        return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
      })
      .map(([date, dayAgg]) => {
        const hours_have_appointment = Array.from(dayAgg.hours.entries())
          .sort(([h1], [h2]) => h1.localeCompare(h2))
          .map(([hour, hAgg]) => ({
            hour,
            count_per_service: Array.from(hAgg.perService.entries())
              .sort(([s1], [s2]) => s1.localeCompare(s2))
              .map(([service_type_id, v]) => ({
                service_type_id,
                count: v.count,
                attendant_id: Array.from(v.attendants.values()),
              })),
            count_per_branch: Array.from(hAgg.perBranch.entries())
              .sort(([b1], [b2]) => b1.localeCompare(b2))
              .map(([branch_id, count]) => ({ branch_id, count })),
          }));

        const count_per_period_service = Array.from(dayAgg.periodByService.entries())
          .sort(([s1], [s2]) => s1.localeCompare(s2))
          .map(([service_type_id, v]) => ({
            service_type_id,
            morning_count: v.morning,
            evening_count: v.evening,
            night_count: v.night,
          }));

        return { date, hours_have_appointment, count_per_period_service };
      });


    const branch = await this.prisma.branchs.findUnique({
      where: {
        id: branchId
      }
    })

    const attendantsByServiceType = await this.prisma.attendants.findMany({
      where: {
        disregarded: false,
        attendant_types: {
          attendant_services: {
            some: {
              service_type_id: serviceTypeId
            }
          }
        }
      },
      include: {
        attendant_types: true,
        users: true
      }
    })

    const serviceType = await this.prisma.service_types.findUnique({
      where: {
        id: serviceTypeId,
      }
    })

    console.log(serviceType)

    const scheduleIds: string[] = []

    const attendantsGrupedByScheduleId: AttendantsGroupedBySchedule[] = Object.values(
      attendantsByServiceType.reduce((acc, item) => {
        const scheduleId = item.attendant_types.schedule_id;
        if (scheduleId !== null) {
          if (!acc[scheduleId]) {
            scheduleIds.push(scheduleId)
            acc[scheduleId] = {
              schedule_id: scheduleId,
              attendants: [],
              attendants_count: 0
            };
          }

          acc[scheduleId].attendants.push({
            id: item.users.id,
            username: item.users.username
          });

          acc[scheduleId].attendants_count++;
        }
        return acc;
      }, {})
    );

    const scheduleTimeSlots = await this.prisma.schedules.findMany({
      where: {
        id: { in: scheduleIds }
      },
      include: {
        schedule_days: {
          include: {
            time_slots: true
          }
        }
      }
    })

    const timeSlotsByScheduleId = scheduleTimeSlots.reduce((acc, schedule) => {
      // para cada schedule cria um map weekday -> slots[]
      const groupedByWeekday = schedule.schedule_days.reduce((dayAcc, day) => {
        dayAcc[day.weekday] = day.time_slots;
        return dayAcc;
      }, {} as Record<string, any[]>);

      acc[schedule.id] = groupedByWeekday;
      return acc;
    }, {} as Record<string, Record<string, any[]>>);

    if (serviceType?.disregarded === true) {
      const WEEKDAY_KEYS = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"] as const;

      // schedules que vamos unir (só as que existem no agrupamento)
      const scheduleIdsToMerge: string[] = (attendantsGrupedByScheduleId || [])
        .map((g: any) => g?.schedule_id)
        .filter(Boolean);

      // index: schedule_id -> attendants[]
      const attendantsByScheduleId: Record<string, Attendant[]> = {};
      for (const g of (attendantsGrupedByScheduleId || [])) {
        if (!g?.schedule_id) continue;
        attendantsByScheduleId[g.schedule_id] = (g.attendants || []).map((a: any) => ({
          id: a.id,
          username: a.username,
        }));
      }

      const res: DayRow[] = [];

      // percorre dia a dia no período (start -> end)
      for (let d = new Date(start); d <= end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
        const dateStr = this.formatDateBR(d);
        const weekdayKey = WEEKDAY_KEYS[d.getDay()];

        // mapa: "HH:mm" -> Map<attendantId, Attendant>
        const hoursToAttendants: Map<string, Map<string, Attendant>> = new Map();

        for (const scheduleId of scheduleIdsToMerge) {
          const slots = (timeSlotsByScheduleId[scheduleId]?.[weekdayKey] || []) as Array<{ time: any; active: boolean }>;
          if (!slots.length) continue;

          // quem atende nesta schedule
          const scheduleAttendants = attendantsByScheduleId[scheduleId] || [];

          for (const slot of slots) {
            if (!slot?.active) continue;

            const hhmm = this.formatHour(slot.time); // precisa devolver "HH:mm"
            if (!hhmm) continue;

            // garante o registro do horário
            if (!hoursToAttendants.has(hhmm)) {
              hoursToAttendants.set(hhmm, new Map<string, Attendant>());
            }

            // adiciona (sem duplicar) todos os attendants dessa schedule neste horário
            const attMap = hoursToAttendants.get(hhmm)!;
            for (const att of scheduleAttendants) {
              if (!att?.id) continue;
              if (!attMap.has(att.id)) attMap.set(att.id, att);
            }
          }
        }

        if (hoursToAttendants.size > 0) {
          const hours: HourRow[] = Array.from(hoursToAttendants.keys())
            .sort((a, b) => a.localeCompare(b))
            .map(h => ({
              hour: h,
              count_avaible_spaces: 99,
              attendants: Array.from(hoursToAttendants.get(h)!.values()),
              have_space: true,
            }));

          res.push({
            date: dateStr,
            hours,
            have_space: true,
            total_available_slots: 999,
          });
        }
      }

      return res; // dias já saem em ordem pelo loop
    } else {
      const keyDH = (dateStr: string, hourStr: string) => `${dateStr}|${hourStr}`;

      const filledByDateHourService = new Map<string, number>();          // `${date}|${hour}|${serviceTypeId}` -> count
      const bookedAttendantsByDateHour = new Map<string, Set<string>>();  // `${date}|${hour}` -> Set(attendantId)
      const branchUsedByDateHour = new Map<string, number>();             // `${date}|${hour}` -> count para a branch atual

      type Period = "morning" | "evening" | "night";
      type PeriodKey = `${string}|${Period}|${string}`;
      const periodKey = (dateStr: string, p: Period, sid: string) => `${dateStr}|${p}|${sid}` as PeriodKey;

      // uso por período do service no dia
      const periodUsedByDateService = new Map<PeriodKey, number>();       // `${date}|${period}|${sid}` -> count

      // helper período a partir de "HH:mm"
      const periodOfHour = (hhmm: string): Period => {
        const hh = parseInt(hhmm.slice(0, 2), 10) || 0;
        if (hh <= 11) return "morning";
        if (hh <= 17) return "evening";
        return "night";
      };

      for (const day of result) {
        for (const h of day.hours_have_appointment) {
          const dh = keyDH(day.date, h.hour);

          if (!bookedAttendantsByDateHour.has(dh)) {
            bookedAttendantsByDateHour.set(dh, new Set<string>());
          }
          const set = bookedAttendantsByDateHour.get(dh)!;

          // por serviço (preenche contagem e ocupa atendentes)
          for (const s of h.count_per_service) {
            filledByDateHourService.set(`${dh}|${s.service_type_id}`, s.count);
            for (const aid of s.attendant_id ?? []) set.add(aid);
          }

          // por branch (somente a branch atual)
          for (const b of h.count_per_branch) {
            if (String(b.branch_id) === String(branchId)) {
              branchUsedByDateHour.set(dh, (branchUsedByDateHour.get(dh) ?? 0) + (b.count ?? 0));
            }
          }
        }

        // agrega uso por período no dia (por service)
        for (const cps of day.count_per_period_service) {
          const sid = String(cps.service_type_id);
          periodUsedByDateService.set(periodKey(day.date, "morning", sid), cps.morning_count ?? 0);
          periodUsedByDateService.set(periodKey(day.date, "evening", sid), cps.evening_count ?? 0);
          periodUsedByDateService.set(periodKey(day.date, "night", sid), cps.night_count ?? 0);
        }
      }

      const slotLimit = attendantsByServiceType?.length ?? 0; // capacidade = nº de atendentes desse service_type

      const WEEKDAY_KEYS = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"] as const;

      // schedules do agrupamento
      const scheduleIdsToMerge: string[] = (attendantsGrupedByScheduleId || [])
        .map((g: any) => g?.schedule_id)
        .filter(Boolean);

      // schedule_id -> attendants[]
      const attendantsByScheduleId: Record<string, Attendant[]> = {};
      for (const g of (attendantsGrupedByScheduleId || [])) {
        if (!g?.schedule_id) continue;
        attendantsByScheduleId[g.schedule_id] = (g.attendants || []).map((a: any) => ({
          id: a.id, username: a.username,
        }));
      }

      const res: DayRow[] = [];
      const toBrDateStr = (d: Date) => (this.formatDateBR ? this.formatDateBR(d) : d.toLocaleDateString("pt-BR"));
      const fmtHour = (t: any) => this.formatHour ? this.formatHour(t) : String(t).slice(11, 16); // seu helper garante "HH:mm"

      // percorre dia a dia
      for (let d = new Date(start); d <= end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
        const dateStr = toBrDateStr(d);
        const weekdayKey = WEEKDAY_KEYS[d.getDay()];

        // "HH:mm" -> Map<attendantId, Attendant> (agenda potencial)
        const hoursToAttendants: Map<string, Map<string, Attendant>> = new Map();

        // une horários ativos de todas as schedules + seus atendentes
        for (const scheduleId of scheduleIdsToMerge) {
          const slots = (timeSlotsByScheduleId[scheduleId]?.[weekdayKey] || []) as Array<{ time: any; active: boolean }>;
          if (!slots?.length) continue;

          const scheduleAtts = attendantsByScheduleId[scheduleId] || [];
          for (const slot of slots) {
            if (!slot?.active) continue;
            const hhmm = fmtHour(slot.time);
            if (!hhmm) continue;

            if (!hoursToAttendants.has(hhmm)) hoursToAttendants.set(hhmm, new Map<string, Attendant>());
            const attMap = hoursToAttendants.get(hhmm)!;
            for (const att of scheduleAtts) {
              if (!att?.id) continue;
              if (!attMap.has(att.id)) attMap.set(att.id, att);
            }
          }
        }

        if (hoursToAttendants.size === 0) continue;
        const branchCapRaw = Number(branch?.availableSpaces ?? 0);
        const branchCap = Number.isFinite(branchCapRaw) && branchCapRaw > 0 ? branchCapRaw : Number.MAX_SAFE_INTEGER;

        // limites por período do service_type (podem ser null = sem limite)
        const stMorningLimit = serviceType?.morningLimit ?? null;
        const stEveningLimit = serviceType?.eveningLimit ?? null;
        const stNightLimit = serviceType?.nightLimit ?? null;

        const limitForPeriod = (p: Period): number | null => {
          if (p === "morning") return stMorningLimit;
          if (p === "evening") return stEveningLimit;
          return stNightLimit;
        };

        const svcId = String(serviceTypeId ?? serviceType?.id ?? "");

        const hours = Array.from(hoursToAttendants.keys())
          .sort((a, b) => a.localeCompare(b))
          .map<HourRow>(h => {
            const dh = keyDH(dateStr, h);

            // 0) período do horário e limites/uso do período
            const period = periodOfHour(h);
            const periodLimit = limitForPeriod(period); // null => sem limite
            const periodUsed = svcId ? (periodUsedByDateService.get(periodKey(dateStr, period, svcId)) ?? 0) : 0;

            // se há limite e já atingiu, horário indisponível (todo período travado)
            if (periodLimit !== null && periodUsed >= periodLimit) {
              return {
                hour: h,
                have_space: false,
                count_avaible_spaces: 0,
                attendants: [],
              };
            }

            // 1) remover atendentes já ocupados nesse dia/hora (qualquer serviço)
            const booked = bookedAttendantsByDateHour.get(dh);
            if (booked?.size) {
              const attMap = hoursToAttendants.get(h)!;
              for (const aid of booked) attMap.delete(aid);
            }

            const attMap = hoursToAttendants.get(h)!;
            const freeAttendants = attMap.size;

            // 2) limite da branch nesse horário
            const usedInBranch = branchUsedByDateHour.get(dh) ?? 0;
            const branchRemaining = Math.max(branchCap - usedInBranch, 0);
            if (branchRemaining <= 0) {
              return {
                hour: h,
                have_space: false,
                count_avaible_spaces: 0,
                attendants: [],
              };
            }

            // 3) limite do serviço por horário (capacidade = nº de atendentes do service_type)
            const serviceCap = slotLimit > 0 ? slotLimit : Number.MAX_SAFE_INTEGER;
            const filledForService = svcId ? (filledByDateHourService.get(`${dh}|${svcId}`) ?? 0) : 0;
            const serviceRemaining = Math.max(serviceCap - filledForService, 0);

            // 4) limite do período restante (se houver)
            const periodRemaining = periodLimit !== null ? Math.max(periodLimit - periodUsed, 0) : Number.MAX_SAFE_INTEGER;

            // 5) vagas finais = min( branchRemaining, serviceRemaining, freeAttendants, periodRemaining )
            const available = Math.max(Math.min(branchRemaining, serviceRemaining, freeAttendants, periodRemaining), 0);
            const have_space = available > 0;

            return {
              hour: h,
              have_space,
              count_avaible_spaces: available,
              attendants: have_space ? Array.from(attMap.values()) : [],
            };
          });

        // --- filtro opcional por atendente (depois de montar `hours`) ---
        const hasAttFilter = !!attendantId && String(attendantId).trim() !== "";
        if (hasAttFilter) {
          for (const h of hours) {
            // se o horário já está indisponível por qualquer limite, mantenha indisponível
            if (!h.have_space) {
              h.attendants = [];
              h.count_avaible_spaces = 0;
              continue;
            }

            // verifica se o atendente está realmente disponível nesse horário
            const match = h.attendants.find(a => String(a.id) === String(attendantId));
            if (match) {
              // mantém só ele e limita o slot a 1 (respeitando todos os limites já aplicados)
              h.attendants = [match];
              h.count_avaible_spaces = Math.min(h.count_avaible_spaces ?? 0, 1);
              h.have_space = (h.count_avaible_spaces ?? 0) > 0;
            } else {
              // atendente não está disponível neste horário
              h.attendants = [];
              h.count_avaible_spaces = 0;
              h.have_space = false;
            }
          }
        }

        type Period = "morning" | "evening" | "night";

        // soma dos slots por período a partir dos horários já calculados
        const sumByPeriod = { morning: 0, evening: 0, night: 0 };
        for (const h of hours) {
          const p = periodOfHour(h.hour);
          sumByPeriod[p] += (h.count_avaible_spaces ?? 0);
        }

        // limites do service_type: null = sem limite


        const anyPeriodLimit =
          stMorningLimit !== null || stEveningLimit !== null || stNightLimit !== null;


        // helper: usados no período (dia + serviço) vindos do dicionário `result`
        const usedInPeriod = (p: Period): number =>
          periodUsedByDateService.get(`${dateStr}|${p}|${svcId}` as const) ?? 0;

        let totalAvailableSlots = 0;

        if (!anyPeriodLimit) {
          // sem limites por período → soma direta dos slots dos horários
          totalAvailableSlots = hours.reduce((acc, h) => acc + (h.count_avaible_spaces ?? 0), 0);
        } else {
          // com limites:
          // - se tem limite: remaining = max(limit - used, 0)
          // - se não tem limite: usa a soma dos horários calculados para aquele período
          const morningRem =
            stMorningLimit !== null ? Math.max(stMorningLimit - usedInPeriod("morning"), 0) : sumByPeriod.morning;
          const eveningRem =
            stEveningLimit !== null ? Math.max(stEveningLimit - usedInPeriod("evening"), 0) : sumByPeriod.evening;
          const nightRem =
            stNightLimit !== null ? Math.max(stNightLimit - usedInPeriod("night"), 0) : sumByPeriod.night;

          totalAvailableSlots = morningRem + eveningRem + nightRem;
        }

        // se quiser, o dia tem vaga se total > 0; senão, mantém o critério anterior
        const dayHaveSpace = totalAvailableSlots > 0 ? true : hours.some(h => h.have_space);

        // push final usando o total calculado
        res.push({
          date: dateStr,
          have_space: dayHaveSpace,
          hours,
          total_available_slots: totalAvailableSlots,
        });
      }

      return res;
    }
  }

}
