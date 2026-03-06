'use strict'

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    updateDoc,
    doc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyByikN6_CXfiJnb1_0ppP60oBQxN8zVxYA",
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
const agora = new Date()
const date = agora.toLocaleDateString("pt-BR")
const hora = agora.toLocaleTimeString("pt-BR")

let reservas = [];

async function carregarReservas() {

    lista.innerHTML = "Carregando...";

    const querySnapshot = await getDocs(collection(db, "rifa"));

    reservas = [];

    querySnapshot.forEach((docSnap) => {
        reservas.push({
            id: docSnap.id,
            ...docSnap.data()
        });
    });

    renderizarReservas(reservas);
}

function renderizarReservas(listaReservas) {

    lista.innerHTML = "";

    let vendidos = 0;
    let reservados = 0;

    listaReservas.forEach((data) => {

        if (data.status === "vendido") vendidos++;
        if (data.status === "reservado") reservados++;

        const div = document.createElement("div");

        div.style.border = "1px solid #ccc";
        div.style.padding = "10px";
        div.style.marginBottom = "20px";
        div.style.borderRadius = "8px";

        div.innerHTML = `
<strong><br>Número:</strong> ${data.number}<br><br>
<strong>Nome:</strong> ${data.name}<br><br>
<strong>Turma:</strong> ${data.turma}<br><br>
<strong>Status:</strong> ${data.status}<br><br>
<strong>Data:</strong> ${date}<br><br>
<strong>Hora:</strong> ${hora}
<br><br>
<button onclick="confirmar('${data.id}')">Confirmar pagamento</button>
<button onclick="cancelar('${data.id}')">Cancelar</button>
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
        status: "vendido"
    });

    alert("Pagamento confirmado!");

    carregarReservas();
}

window.cancelar = async function (id) {
    await deleteDoc(doc(db, "rifa", id));

    alert("Reserva cancelada");

    carregarReservas();
}

setInterval(() => {
    location.reload();
}, 20000);

searchInput.addEventListener("input", () => {

    const termo = searchInput.value.toLowerCase();

    const filtrados = reservas.filter((r) =>
        r.name.toLowerCase().includes(termo) ||
        String(r.number).includes(termo)
    );

    renderizarReservas(filtrados);

});

carregarReservas();