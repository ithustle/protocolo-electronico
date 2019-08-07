const app = require("electron").remote,
    //{ dialog } = require("electron"),
    dialog = app.dialog,
    path = require("path"),
    url = require("url"),
    XLSX = require("xlsx"),
    jsPDF = require("jspdf"),
    $ = require("jquery"),
    readXlsxFile = require("read-excel-file/node"),
    fs = require("fs"),
    os = require("os");

    const ipc = app.ipcMain;
    const shell = app.shell;

const {
    insereTrabalho,
    verTrabalhos,
    registaProcesso,
    verProcessos,
    verProcesso,
    saidaProcesso,
    verDepartamentos
} = require("./database.js");
const { differenceBetween, tempoPercorridos, getWorkingDays } = require("./helper.js");

const entrada = document.getElementById("entrada");
const report = document.getElementById("report");
const config = document.getElementById("config");
const saidaDoProcesso = document.getElementById("saidaDoProcesso");
const entrada_saida = document.getElementById("entrada_saida");
const check_ocultar = document.getElementById("check_ocultar");
const importacao_processos = document.getElementById("importacao_processos");

//Botões
const btn_entrada = document.getElementById("btn_entrada");
const btn_report = document.getElementById("btn_report");
const btn_importar = document.getElementById("btn_importar");
const btn_add = document.getElementById("btn_add");


// Inputs
const nome_servico = document.getElementById("nome_servico");
const numero_dias = document.getElementById("numero_dias");

const nome_solicitante = document.getElementById("nome_solicitante");
const numero_id = document.getElementById("numero_id");
const numero_processo = document.getElementById("numero_processo");
const numero_telefone = document.getElementById("numero_telefone");
const combo = document.getElementById("combo");
const data_entrada = document.getElementById("data_entrada");
const procurar = document.getElementById("procurar");
const file_excel = document.getElementById("file_excel");
const file_excel_padronizacao = document.getElementById("file_excel_padronizacao");

//Container
const combo_solicitacao = document.getElementById("combo");
const combo_departamento = document.getElementById("combo_departamento");
const combo_departamento_trabalho = document.getElementById("combo_departamento_trabalho");
const content_table = document.getElementById("content_table");

const schema = {
    'Nome do Solicitante': {
        prop: 'nome_solicitante',
        type: String
    },
    'Nº de Identificação': {
        prop: 'numero_id',
        type: String
    },
    'Nº de Processo': {
        prop: 'numero_processo',
        type: String
    },
    'Nº de Telefone': {
        prop: 'numero_telefone',
        type: String
    },
    'Serviço': {
        prop: 'trabalho',
        type: String
    },
    'Data de Entrada': {
        prop: 'data_entrada',
        type: Date
    },
    'Data de Saida' : {
        prop: 'data_saida',
        type: Date
    },
    'Departamento Ministerial' : {
        prop: 'departamento',
        type: String
    }
};

const schema_padronizacao = {
    'Serviços': {
        prop: 'nome_servico',
        type: String
    },
    'Nº de dias': {
        prop: 'numero_dias',
        type: String
    },
    
};

Date.prototype.addDays = function (h, d) {
    return new Date(new Date(h).getTime() + 864E5 * d);
};

// Variáveis e constantes;
let tables_lines = "";
let combo_lines = "";

report.style.display = "none";
config.style.display = "none";
importacao_processos.style.display = "none";

// LOADING

if (window.localStorage.getItem("check") == "done") {
    check_ocultar.innerHTML = "X";
} else {
    check_ocultar.innerHTML = "";
}

/* FUNCTIONS */

regista = () => {
    const data = {
        nome_solicitante: nome_solicitante.value,
        numero_id: numero_id.value,
        numero_processo: numero_processo.value,
        trabalho: combo.value,
        departamento: combo_departamento.value,
        data_entrada: data_entrada.value,
        numero_telefone: numero_telefone.value
    };

    if (numero_processo.value == "") {
        dialog.showMessageBox({ type: "warning", message: "Número de processo em falta.", buttons: ["Ok"] });
    } else if (data_entrada.value == "") {
        dialog.showMessageBox({ type: "warning", message: "Data de entrada em falta.", buttons: ["Ok"] });
    } else {
        registaProcesso(data);

        nome_solicitante.value = "";
        numero_processo.value = "";
        numero_id.value = "";
        numero_telefone.value = "";
        data_entrada.value = "";
        dialog.showMessageBox({ type: "info", message: "Operação concluida com sucesso.",  buttons: ["Ok"]},);
        data.titulo = "Comprovativo de Entrada do Processo";
        imprime(data);
    }
};

s2ab = (s) => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
};

imprime = processo => {

    const win = new app.BrowserWindow(
        {
            fullscreenable: true,
            webPreferences: {
                nodeIntegration: true
            }
        }
    );

    win.webContents.on('did-finish-load', () => {
        win.webContents.send('processo', processo);
    });

    win.loadURL(url.format({
        pathname: path.join(__dirname, "print.html"),
        protocol: "file",
        slashes: true
    }));
};

relatorio = () => {
    const win = new app.BrowserWindow(
        {
            fullscreenable: true,
            webPreferences: {
                nodeIntegration: true
            }
        }
    );

    win.loadURL(url.format({
        pathname: path.join(__dirname, "print_relatorio.html"),
        protocol: "file",
        slashes: true
    }));
};

extraiExcel = () => {
    const wb = XLSX.utils.table_to_book(document.getElementById('tabela_processos'), { sheet: "Relatório" });
    const wbout = XLSX.write(wb, { bookType: 'xlsx', bookSST: true, type: 'binary' });

    wb.SheetNames.push("Test Sheet");
    const ws = XLSX.utils.table_to_sheet(document.getElementById('tabela_processos'));
    wb.Sheets["Relatório"] = ws;

    saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), 'Relatório_PMAN.xlsx');
};

extraiPdf = () => {
    const pdf = new jsPDF('p', 'pt', 'letter');

    pdf.cellInitialize();
    pdf.setFontSize(10);
    $.each($('#tabela_processos tr'), function (i, row) {
        $.each($(row).find("td, th"), function (j, cell) {
            const txt = $(cell).text().trim() || " ";
            //var width = (j==4) ? 40 : 70; //make 4th column smaller
            pdf.cell(25, 50, 110, 30, txt, i);
        });
    });

    pdf.save('Relatório_PMAN.pdf');
};

classificadorTempo = async numero_processo => {
    const processo = await verProcesso(numero_processo);
    const trabalhos = await verTrabalhos();
    const date = new Date();
    const PERCENT = 0.5;

    for (let i in trabalhos) {

        if (trabalhos[i].nome_servico == processo.trabalho) {

            const numero_dias = trabalhos[i].numero_dias;
            const valor_dia_intermedio = numero_dias * PERCENT;
            const data_para_sair = date.addDays(processo.data_entrada, trabalhos[i].numero_dias);
            const dias_faltam = differenceBetween(data_para_sair);

            if (processo.data_saida !== undefined) {
                return "#333";
            }

            if (dias_faltam > valor_dia_intermedio) {
                return "#5FBA7D";
            }

            if (dias_faltam <= valor_dia_intermedio && dias_faltam > 0) {
                return "#FFB935";
            }

            if (dias_faltam <= 0) {
                return "#FF0000";
            }
        }
    }

    return null;
};

openModal = processo => {

    let win = new app.BrowserWindow({
        parent: app.getCurrentWindow(),
        modal: true,
        width: 600,
        height: 360,
        resizable: false,
        fullscreenable: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    win.webContents.on('did-finish-load', () => {
        win.webContents.send('processo', JSON.stringify(processo));
    });

    win.loadURL(url.format({
        pathname: path.join(__dirname, "saidaProcesso.html"),
        protocol: "file",
        slashes: true
    }));
};

registarDepartamento = () => {

    let win = new app.BrowserWindow({
        parent: app.getCurrentWindow(),
        modal: true,
        width: 600,
        height: 260,
        resizable: false,
        fullscreenable: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    /*win.webContents.on('did-finish-load', () => {
        win.webContents.send('processo', JSON.stringify(processo));
    });*/

    win.loadURL(url.format({
        pathname: path.join(__dirname, "departamento.html"),
        protocol: "file",
        slashes: true
    }));
};

abreDialogRelatorio = () => {
    const win = new app.BrowserWindow({
        parent: app.getCurrentWindow(),
        modal: true,
        width: 600,
        height: 320,
        resizable: false,
        fullscreenable: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // win.webContents.on('did-finish-load', () => {
    //     win.webContents.send('processo', processo);
    // });

    win.loadURL(url.format({
        pathname: path.join(__dirname, "relatorio_geral.html"),
        protocol: "file",
        slashes: true
    }));
};


solicitacoes = async (a, b) => {

    let processos;

    if (window.localStorage.getItem("check") == "done") {
        processos = await verProcessos("X");
    } else {
        processos = await verProcessos();
    }

    //const processos_cortados = processos.slice(a, b /*0, 3 */);

    for (let i = 0; i < processos.length; i++) {
        const cor_categoria = await classificadorTempo(processos[i].numero_processo);

        processos[i].categ = cor_categoria === "#5FBA7D" ? "Normal" : cor_categoria === "#FFB935" ? "Prioridade" : cor_categoria === "#333" ? "Concluído" : "Recuperação";
        processos[i].dias_decorridos = tempoPercorridos(processos[i].data_entrada, processos[i].data_saida);
        processos[i].dias_apos_prazo = tempoPercorridos(processos[i].data_saida);
        //<td>${processos[i].dias_apos_prazo}</td>
        tables_lines +=
            `<tr>
                <td>${processos[i].departamento}</td>
                <td>${processos[i].numero_processo}</td>
                <td>${processos[i].data_entrada}</td>
                <td>${processos[i].data_saida}</td>
                <td>${processos[i].dias_decorridos}</td>
                <td>${processos[i].trabalho}</td>
                <td>${processos[i].categ}<div style='background-color: ${cor_categoria}; height: 10px; width: 10px; display: inline-block; margin-left: 5px'></div></td>
            </tr>`;
        //<th>Dias Decorridos Após Prazo</th>
        content_table.innerHTML =
            `<table id='tabela_processos'>
            <tr>
                <th>Departamento</th>
                <th>Número de Processo</th>
                <th>Data do Pedido</th>
                <th>Data de Entrega do Pedido</th>
                <th>Dias Decorridos</th>
                <th>Solicitação</th>
                <th>Estado</th>
            </tr>
            ${tables_lines}
        </table>`;
    }
};

guardaConfig = () => {
    const trabalho = {
        nome_servico: nome_servico.value,
        numero_dias: numero_dias.value
    };

    insereTrabalho(trabalho);
    nome_servico.value = "";
    numero_dias.value = "";
    dialog.showMessageBox({ type: "info", message: "Operação concluida com sucesso.",  buttons: ["Ok"] });
    //window.location.reload();
};

fnSaidaProcesso = async () => {

    const processo = await verProcesso(numero_processo_saida.value);

    const data = {
        numero_processo: numero_processo_saida.value,
        data_saida: data_saida.value
    };

    if (numero_processo_saida == "" || data_saida.value == "") {
        dialog.showMessageBox({ type: "warning", message: "Número do processo ou data de saída em falta.",  buttons: ["Ok"] });
    } else {
        saidaProcesso(data).then(res => {
            processo.data_saida = res.data_saida;
            processo.titulo = "Comprovativo de Conclusão do Processo";
            delete processo.data_entrada;
            setTimeout(() => {
                imprime(processo);
                numero_processo_saida.value = "";
                data_saida.value = "";
            }, 200);
        })
            .catch(e => {
                console.log(e);
            });
    }
};

showTrabalho = async () => {
    const trabalhos = await verTrabalhos();
    combo_lines = "";

    for (let i in trabalhos) {

        combo_lines +=
            `
            <select>
                <option>${trabalhos[i].nome_servico}</option>
            </select>
        `;

        combo_solicitacao.innerHTML = combo_lines;

    }
};

showDepartamentos = async () => {
    const departamentos = await verDepartamentos();
    combo_lines = "";

    for (let i in departamentos) {

        combo_lines +=
            `
            <select>
                <option>${departamentos[i].departamento}</option>
            </select>
        `;

        combo_departamento.innerHTML = combo_lines;
        combo_departamento_trabalho.innerHTML = combo_lines;
    }
};

importaProcessos = () => {
    const docs = file_excel.files[0];
    if (docs === undefined) {
        dialog.showMessageBox({ type: "warning", message: "Nenhum ficheiro para importar encontrado.", buttons: ["Ok"] });
    } else {
        readXlsxFile(docs.path, { schema }).then(({ rows, errors }) => {
            for (let i in rows) {
                const dataTimestamp = Date.parse(rows[i].data_entrada); 
                const dataSaidaTimestamp = Date.parse(rows[i].data_saida); 

                const date = new Date(dataTimestamp);
                const date2 = new Date(dataSaidaTimestamp);

                const dia = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
                const mes = (date.getMonth() + 1) < 10 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1);
                const ano = date.getUTCFullYear();

                const dia2 = date2.getDate() < 10 ? "0" + date2.getDate() : date2.getDate();
                const mes2 = (date2.getMonth() + 1) < 10 ? "0" + (date2.getMonth() + 1) : (date2.getMonth() + 1);
                const ano2 = date2.getUTCFullYear();


                const dataEntrada = mes + '/' + dia + '/' + ano;
                const dataSaida = mes2 + '/' + dia2 + '/' + ano2;

                console.log(dataEntrada);

                rows[i].data_entrada = dataEntrada;
                //delete rows[i].data_saida;
                rows[i].data_saida = dataSaida;

                $("#loading").css("width", ((i / (rows.length - 1)) * 100) + "%");
                $("#loading").css("padding", "10px");
                $("#perc").html(((i / (rows.length - 1)).toFixed(1) * 100) + "%");
                registaProcesso(rows[i]);
            }
        });
        dialog.showMessageBox({ type: "info", message: "Operação efectuada com sucesso.", buttons: ["Ok"] });
    }
};

importaPadronizacao = () => {
    const docs = file_excel_padronizacao.files[0];
    const schema = [];

    if (docs === undefined) {
        dialog.showMessageBox({ type: "warning", message: "Nenhum ficheiro para importar encontrado.", buttons: ["Ok"] });
    } else {
        readXlsxFile(docs.path, { sheet: 'Lista de Serviços' }).then(rows => {
            for (let i in rows) {
                //schema.push({ nome_servico: rows[i][0], numero_dias: rows[i][1], departamento: rows[i][2] });
                schema.push({ nome_servico: rows[i][0], numero_dias: rows[i][1] });
            }
            
            for (let i in schema) {
                insereTrabalho(schema[i]);
            }
        });
        dialog.showMessageBox({ type: "info", message: "Operação efectuada com sucesso.", buttons: ["Ok"] });
    }
};

ipc.on("print-to-pdf", event => {
    const pdfPath = path.join("./", "Relatório_PE.pdf");
    const win = app.BrowserWindow.fromWebContents(event.sender);

    win.webContents.printToPDF({ printBackground: true }, (err, data) => {
        if (err) return console.log(err.message);

        fs.writeFile(pdfPath, data, err => {
            if (err) return console.log(err.message);
            //shell.openExternal("file://", pdfPath);
            event.sender.send("wrote-pdf", pdfPath);
        });
    });
});

/* ACTIONS CLICKS */

btn_add.addEventListener("click", () => {
    registarDepartamento();
});

btn_entrada.addEventListener("click", () => {
    report.style.display = "none";
    importacao_processos.style.display = "none";
    entrada.style.display = "block";
    saidaDoProcesso.style.display = "block";
    config.style.display = "none";
    window.localStorage.removeItem("login");
    showTrabalho();
    showDepartamentos();
});

btn_importar.addEventListener("click", () => {
    report.style.display = "none";
    entrada.style.display = "none";
    importacao_processos.style.display = "block";
    saidaDoProcesso.style.display = "none";
    config.style.display = "none";
    window.localStorage.removeItem("login");
});

btn_report.addEventListener("click", () => {

    //if (window.localStorage.getItem("login") === "feito") {
    report.style.display = "block";
    //entrada_saida.style.display = "none";
    importacao_processos.style.display = "none";
    entrada.style.display = "none";
    saidaDoProcesso.style.display = "none";
    config.style.display = "none";
    tables_lines = "";
    window.localStorage.removeItem("login");
    solicitacoes();
    /*} else {
        openLogin();
    }*/
});

btn_config.addEventListener("click", () => {
    //if (window.localStorage.getItem("login") === "feito") {
        report.style.display = "none";
        config.style.display = "block";
        entrada.style.display = "none";
        importacao_processos.style.display = "none";
        saidaDoProcesso.style.display = "none";
        window.localStorage.removeItem("login");
    //} else {
    //    openLogin();
    //}
});

procurar.addEventListener("keyup", async (event) => {
    event.preventDefault();
    if (event.keyCode === 13) {
        const processo = await verProcesso(procurar.value);

        if (processo === undefined) {
            dialog.showMessageBox({ type: "warning", message: "Nenhum processo foi encontrado.",  buttons: ["Ok"] });
        } else {
            processo.titulo = "Comprovativo de Entrada do Processo";
            imprime(processo);
        }
    }
});

// Ocultar
check_ocultar.addEventListener("click", (event) => {
    event.preventDefault();

    if (check_ocultar.innerHTML == "X") {
        check_ocultar.innerHTML = "";
        window.localStorage.removeItem("check");
        tables_lines = "";
        solicitacoes();
    } else {
        check_ocultar.innerHTML = "X";
        window.localStorage.setItem("check", "done");
        tables_lines = "";
        solicitacoes();
    }
});

/* ACTIONS CLICKS FIM */
showTrabalho();
showDepartamentos();
/* FUNCTIONS FIM */

/* APPENDS */



/* APPENDS FIM */
