function findFirstDuplicate(numbers) {
  const countArr = new Set();

  for (const num of numbers) {
    if (countArr.has(num)) {
      return num; // Retorna o número duplicado
    }
    countArr.add(num);
  }

  return null; // Se não houver duplicados
}

const res = findFirstDuplicate([1, 2, 3, 4, 2]);
console.log(res);
