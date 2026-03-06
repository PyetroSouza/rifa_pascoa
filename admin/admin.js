'use strict'

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
    getFirestore,
    collection,
    onSnapshot,
    updateDoc,
    doc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "SUA_KEY",
    authDomain: "site-para-rifa-de-pascoa-25745.firebaseapp.com",
    projectId: "site-para-rifa-de-pascoa-25745",
    storageBucket: "site-para-rifa-de-pascoa-25745.appspot.com",
    messagingSenderId: "1004843167683",
    appId: "1:1004843167683:web:93211e8925926723c3d776"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const lista = document.getElementById("listaReservas");
const stats = document.getElementById("stats");
const searchInput = document.getElementById("searchInput");

let reservas = [];

function escutarReservas() {

    onSnapshot(collection(db, "rifa"), (snapshot) => {

        reservas = [];

        snapshot.forEach((docSnap) => {

            reservas.push({
                id: docSnap.id,
                ...docSnap.data()
            });

        });
        // reservas.sort((a, b) => a.number - b.number)
        renderizarReservas(reservas);

    });

}


function renderizarReservas(listaReservas) {

    lista.innerHTML = "";

    let vendidos = 0;
    let reservados = 0;

    listaReservas.forEach((dataUpper) => {

        let dataUpper = String(dataUpper).toUpperCase()

        if (dataUpper.status === "VENDIDO") vendidos++;
        if (dataUpper.status === "RESERVADO") reservados++;

        let dataFormatada = "-";
        let horaFormatada = "-";

        if (dataUpper.createdAt) {

            const dataFirebase = new Date(dataUpper.createdAt)

            dataFormatada = dataFirebase.toLocaleDateString("pt-BR")
            horaFormatada = dataFirebase.toLocaleTimeString("pt-BR")

        }
        const div = document.createElement("div");

        div.style.border = "1px solid #ccc";
        div.style.padding = "10px";
        div.style.marginBottom = "20px";
        div.style.borderRadius = "8px";

        div.innerHTML = `
<strong>Número:</strong> ${dataUpper.number}<br><br>
<strong>Nome:</strong> ${dataUpper.name}<br><br>
<strong>Turma:</strong> ${dataUpper.turma}<br><br>
<strong>Status:</strong> ${dataUpper.status}<br><br>
<strong>Data:</strong> ${dataFormatada}<br><br>
<strong>Hora:</strong> ${horaFormatada}
<br><br>
<button onclick="confirmar('${dataUpper.id}')">Confirmar pagamento</button>
<button onclick="cancelar('${dataUpper.id}')">Cancelar</button>
`;

        lista.appendChild(div);

    });

    stats.innerHTML = `
<p>Vendidos: <strong>${vendidos}</strong></p>
<p>Reservados: <strong>${reservados}</strong></p>
<p>Disponíveis: <strong>${150 - vendidos - reservados}</strong></p>
`;

}


window.confirmar = async function (id) {

    await updateDoc(doc(db, "rifa", id), {
        status: "VENDIDO"
    });

    alert("Pagamento confirmado!");

}


window.cancelar = async function (id) {

    await deleteDoc(doc(db, "rifa", id));

    alert("Reserva cancelada");

}

reservas.sort((a, b) => a.number - b.number)
searchInput.addEventListener("input", () => {

    const termo = searchInput.value.toUpperCase();

    const filtrados = reservas.filter((r) =>
        r.name.toUpperCase().includes(termo) ||
        String(r.number).includes(termo)
    );

    renderizarReservas(filtrados);

});


escutarReservas();