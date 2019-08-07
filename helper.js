const differenceBetween = (data) => {
    const hoje = new Date();

    data = new Date(data);
    const diffDays = parseInt((data - hoje) / (1000 * 60 * 60 * 24));
    return diffDays;
};

const tempoPercorridos = (dataEntrada, dataSaida) => {
    const hoje = new Date();
    dataEntrada = new Date(dataEntrada);
    dataSaida = new Date(dataSaida);

    const diffDays = getWorkingDays(dataEntrada, hoje);

    return diffDays - 1;
};

const getWorkingDays = (startDate, endDate) => {
    let result = 0;

    const currentDate = startDate;
    while (currentDate <= endDate) {

        const weekDay = currentDate.getDay();
        if (weekDay != 0 && weekDay != 6) result++;

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
};


module.exports = {
    differenceBetween,
    tempoPercorridos,
    getWorkingDays
};