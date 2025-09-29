-- CreateEnum
CREATE TYPE "expertise_enum" AS ENUM ('PREVIDENCIARIO', 'TRABALHISTA');

-- CreateEnum
CREATE TYPE "role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "status" AS ENUM ('ATENDENDO', 'CONCLUIDO', 'AGUARDANDO', 'ATRASADO', 'CANCELADO', 'REMARCADO', 'AGENDADO', 'ANOTANDO');

-- CreateTable
CREATE TABLE "alembic_version" (
    "version_num" VARCHAR(32) NOT NULL,

    CONSTRAINT "alembic_version_pkc" PRIMARY KEY ("version_num")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "appointment_id" UUID,
    "created_by_id" UUID NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL,
    "updateAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "customer" VARCHAR(160) NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "date" TIMESTAMPTZ(6) NOT NULL,
    "arrivalAt" TIMESTAMP(6),
    "attendedAt" TIMESTAMP(6),
    "branch_id" UUID NOT NULL,
    "status" "status" NOT NULL,
    "service_type_id" UUID,
    "attendant_id" UUID,
    "attendant_type_id" UUID,
    "conclusionAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL,
    "updateAt" TIMESTAMP(6) NOT NULL,
    "created_by_id" UUID,
    "Notes" VARCHAR(1000) DEFAULT '',
    "customer_data_link" VARCHAR(512),
    "service_link" VARCHAR(512),
    "expertise" "expertise_enum",
    "notesTakenAt" TIMESTAMP(6),
    "partner_id" UUID,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendant_services" (
    "attendant_id" UUID NOT NULL,
    "service_type_id" UUID NOT NULL,

    CONSTRAINT "attendant_services_pkey" PRIMARY KEY ("attendant_id","service_type_id")
);

-- CreateTable
CREATE TABLE "attendant_types" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(255),
    "createdAt" TIMESTAMP(6) NOT NULL,
    "updateAt" TIMESTAMP(6) NOT NULL,
    "schedules_id" UUID,
    "exclusive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "attendant_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendants" (
    "id" UUID NOT NULL,
    "avaiable" BOOLEAN NOT NULL,
    "attendant_type_id" UUID NOT NULL,
    "disregarded" BOOLEAN NOT NULL DEFAULT false,
    "called_by_partner" BOOLEAN DEFAULT false,

    CONSTRAINT "attendants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branchs" (
    "id" UUID NOT NULL,
    "name" VARCHAR NOT NULL,
    "availableSpaces" INTEGER NOT NULL,
    "address" VARCHAR NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL,
    "updateAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "branchs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conditions_by_types" (
    "id" UUID NOT NULL,
    "name" VARCHAR(24) NOT NULL,
    "service_type_id" UUID,
    "time" TIME(6) NOT NULL,
    "status" "status" NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL,
    "updateAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "conditions_by_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_intervals" (
    "id" UUID NOT NULL,
    "schedule_day_id" UUID NOT NULL,
    "start" TIME(6) NOT NULL,
    "end" TIME(6) NOT NULL,
    "interval" INTEGER NOT NULL,

    CONSTRAINT "custom_intervals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" UUID NOT NULL,
    "entity" VARCHAR(100) NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "field" VARCHAR(50),
    "old_value" VARCHAR(1000),
    "new_value" VARCHAR(1000),
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" UUID NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_day_intervals" (
    "id" UUID NOT NULL,
    "schedule_day_id" UUID NOT NULL,
    "start" TIME(6) NOT NULL,
    "end" TIME(6) NOT NULL,
    "interval" INTEGER NOT NULL,

    CONSTRAINT "schedule_day_intervals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_days" (
    "id" UUID NOT NULL,
    "schedule_id" UUID NOT NULL,
    "weekday" VARCHAR(10) NOT NULL,

    CONSTRAINT "schedule_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_types" (
    "id" UUID NOT NULL,
    "name" VARCHAR(32) NOT NULL,
    "description" VARCHAR(80) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL,
    "updateAt" TIMESTAMP(6) NOT NULL,
    "disregarded" BOOLEAN NOT NULL DEFAULT false,
    "morningLimit" INTEGER,
    "eveningLimit" INTEGER,
    "nightLimit" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "service_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_lists" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "task_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "task_list_id" UUID NOT NULL,
    "description" VARCHAR NOT NULL,
    "due" BOOLEAN NOT NULL,
    "order" SMALLINT NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_slots" (
    "id" UUID NOT NULL,
    "schedule_day_id" UUID NOT NULL,
    "time" TIME(6) NOT NULL,
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "time_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(80) NOT NULL,
    "email" VARCHAR(120),
    "password" VARCHAR(170) NOT NULL,
    "role" "role" NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL,
    "updateAt" TIMESTAMP(6) NOT NULL,
    "branch_id" UUID,
    "type" VARCHAR NOT NULL,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schedules_name_key" ON "schedules"("name");

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_attendant_id_fkey" FOREIGN KEY ("attendant_id") REFERENCES "attendants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_attendant_type_id_fkey" FOREIGN KEY ("attendant_type_id") REFERENCES "attendant_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attendant_services" ADD CONSTRAINT "attendant_services_attendant_id_fkey" FOREIGN KEY ("attendant_id") REFERENCES "attendant_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attendant_services" ADD CONSTRAINT "attendant_services_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attendant_types" ADD CONSTRAINT "attendant_types_schedules_id_fkey" FOREIGN KEY ("schedules_id") REFERENCES "schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendants" ADD CONSTRAINT "attendants_attendant_type_id_fkey" FOREIGN KEY ("attendant_type_id") REFERENCES "attendant_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attendants" ADD CONSTRAINT "attendants_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "conditions_by_types" ADD CONSTRAINT "conditions_by_types_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "custom_intervals" ADD CONSTRAINT "custom_intervals_schedule_day_id_fkey" FOREIGN KEY ("schedule_day_id") REFERENCES "schedule_days"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_day_intervals" ADD CONSTRAINT "schedule_day_intervals_schedule_day_id_fkey" FOREIGN KEY ("schedule_day_id") REFERENCES "schedule_days"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "schedule_days" ADD CONSTRAINT "schedule_days_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_lists" ADD CONSTRAINT "task_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_task_list_id_fkey" FOREIGN KEY ("task_list_id") REFERENCES "task_lists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_schedule_day_id_fkey" FOREIGN KEY ("schedule_day_id") REFERENCES "schedule_days"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
