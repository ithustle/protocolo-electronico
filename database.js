const app = require("electron").remote;
const dialog = app.dialog;
const Dexie = require("dexie");

const db = new Dexie("PMN");
db.version(1).stores({
    trabalhos: "++id, nome_servico, numero_dias",
	entradaProcessos: "++id, nome_solicitante, numero_id, numero_processo, numero_telefone, trabalho, data_entrada, data_saida",
	loginAdmin: "++id, user_name, senha"
});

db.version(2).stores({
    trabalhos: "++id, nome_servico, numero_dias, departamento",
	entradaProcessos: "++id, nome_solicitante, numero_id, numero_processo, numero_telefone, trabalho, data_entrada, data_saida, departamento",
	loginAdmin: "++id, user_name, senha",
	departamentoMinisterial: "++id, departamento"
});

db.version(3).stores({
    trabalhos: "++id, nome_servico, numero_dias, departamento",
	entradaProcessos: "++id, nome_solicitante, numero_id, numero_processo, numero_telefone, trabalho, data_entrada, data_saida, departamento",
	loginAdmin: "++id, user_name, senha",
	departamentoMinisterial: "++id, departamento",
	relatorioGeral: "++id, departamento, numero_processo, processo, estado, dias_decorridos"
});

/* COLECÇÃO TRABALHO */
const insereTrabalho = trabalho => {
	db.trabalhos.add(trabalho);
};

const verTrabalhos = () => new Promise((resolve, reject) => {
	try {

		db.trabalhos.toArray(trabalho => {
	        resolve(trabalho);
	    });

	} catch (e) {
		reject (e);
	}
});

/* COLECÇÃO PROCESSOS */
const registaProcesso = processo => {
	try {
		db.entradaProcessos.add(processo);
	} catch (e) {
		dialog.showMessageBox({type: "error", message: "Não foi possível concluir a operação com sucesso. Consulte o suporte técnico.",  buttons: ["Ok"]});
	}
};

const saidaProcesso = async processo1 => new Promise(( resolve, reject ) => {
	try {
		
		db.entradaProcessos
		.where("numero_processo")
		.equals(processo1.numero_processo)
		.or("numero_telefone")
		.equals(processo1.numero_processo)
		.or("numero_id")
		.equals(processo1.numero_processo)
		.toArray(processo => {
	        if (processo[0] === undefined) {
				dialog.showMessageBox({type: "error", message: "Este número de processo não existe.",  buttons: ["Ok"]});
			} else {

				if (processo[0].data_saida !== undefined) {
					dialog.showMessageBox({type: "warning", message: "Este processo já está concluído.",  buttons: ["Ok"]});
				} else {
					db.entradaProcessos.where("numero_processo").equals(processo1.numero_processo).modify({ data_saida: processo1.data_saida });
					dialog.showMessageBox({type: "info", message: "Operação concluida com sucesso.",  buttons: ["Ok"]});
					resolve({ data_saida: processo1.data_saida });
				}

				
			}
	    });
	} catch (e) {
		dialog.showMessageBox({type: "error", message: "Não foi possível concluir a operação com sucesso. Consulte o suporte técnico.",  buttons: ["Ok"]});
	}
}); 

const verProcessos = (ocultar) => new Promise((resolve, reject) => {
	try {
		// Pegar apenas os que não têm data de saída
		let proc = [];
		db.entradaProcessos.toArray(processos => {

			for (let i in processos) {
				if (ocultar === undefined) {
					proc.push(processos[i]);
				} else {
				
					if (processos[i].data_saida === undefined) {
						proc.push(processos[i]);
					}
				}
			}
	        resolve(proc);
	    });

	} catch (e) {
		reject (e);
	}
});

const verProcesso = numero_processo => new Promise((resolve, reject) => {
	try {
		db.entradaProcessos
		.where("numero_processo")
		.equals(numero_processo)
		.or("numero_id")
		.equals(numero_processo)
		.or("numero_telefone")
		.equals(numero_processo)
		.toArray(processo => {
	        resolve(processo[0]);
	    });

	} catch (e) {
		reject (e);
	}
});

/* COLECTION REGISTA DEPARTAMENTO */

const registaDepartamento = dados => {
	db.departamentoMinisterial.toArray(departamento => {

		let departamentos = [];

		for (let i in departamento) {
			departamentos.push(departamento[i].departamento);
		}

		if (!departamentos.includes(dados.departamento)) {
			db.departamentoMinisterial.add(dados);
			dialog.showMessageBox({type: "info", message: "Departamento registado com sucesso.",  buttons: ["Ok"]});
		} else {
			dialog.showMessageBox({type: "warning", message: "Este departamento ministerial já se encontra registado.", buttons: ["Ok"]});
		}
	});
};

const verDepartamentos = () => new Promise((resolve, reject) => {
	try {

		db.departamentoMinisterial.toArray(departamento => {
	        resolve(departamento);
	    });

	} catch (e) {
		reject (e);
	}
});

/* ========================================================= COLECÇÃO RELATÓRIO GERAL	 */
const registaRelatorioGeral = processo => {
	try {
		db.relatorioGeral.add(processo);
	} catch (e) {
		dialog.showMessageBox({type: "error", message: "Não foi possível concluir a operação com sucesso. Consulte o suporte técnico.",  buttons: ["Ok"]});
	}
};

const verRelatorioGeral = () => new Promise((resolve, reject) => {
	try {
		db.entradaProcessos.toArray(relatorio => {
	        resolve(relatorio);
	    });

	} catch (e) {
		reject (e);
	}
});


/* ======================================================================= */

/*
const login = (login) => new Promise((resolve, reject) => {
	try {
		db.loginAdmin
		.where(login)
		.toArray( login => {
			if (login != "") {
				resolve(login);
			} else {
				dialog.showMessageBox({type: "error", message: "Nome de utilizador e/ou palavra-passe incorrectas."});
			}
	        
	    });

	} catch (e) {
		console.log(e)
		reject (e)
	}
});
*/

module.exports = {
	insereTrabalho,
	verTrabalhos,
	registaProcesso,
	saidaProcesso,
	verProcessos,
	verProcesso,
	registaDepartamento,
	verDepartamentos,
	registaRelatorioGeral,
	verRelatorioGeral
};