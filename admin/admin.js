/**********************************************************************************
 * Objetivo: Arquivo responsável por controlar a parte administrativa do site, onde
   é possível visualizar as reservas, confirmar pagamentos e cancelar reservas.
 * Data: 05/03/2026 (quinta-feira)
 * Autor(es):
    - Gustavo Vidal de Abreu
    - Kauan Alves Pereira
    - Kayque Brenno Ferreira Almeida
    - Pyetro Ferreira de Souza
 * Versão: 2.0
**********************************************************************************/

'use strict'

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'
import {
    getFirestore,
    collection,
    onSnapshot,
    updateDoc,
    doc,
    deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'

const firebaseConfig = {
    apiKey: 'AIzaSyByikN6_CXfiJnb1_0ppP60oBQxN8zVxYA',
    authDomain: 'site-para-rifa-de-pascoa-25745.firebaseapp.com',
    projectId: 'site-para-rifa-de-pascoa-25745',
    storageBucket: 'site-para-rifa-de-pascoa-25745.appspot.com',
    messagingSenderId: '1004843167683',
    appId: '1:1004843167683:web:93211e8925926723c3d776'
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const lista = document.getElementById('listaReservas')
const stats = document.getElementById('stats')
const searchInput = document.getElementById('searchInput')

let reservas = []

function escutarReservas() {
    onSnapshot(collection(db, 'rifa'), (snapshot) => {
        reservas = []

        snapshot.forEach((docSnap) => {

            reservas.push({
                id: docSnap.id,
                ...docSnap.data()
            })

        })

        reservas.sort((a, b) => a.number - b.number)

        renderizarReservas(reservas)
    })
}

function renderizarReservas(listaReservas) {
    lista.innerHTML = ''

    let vendidos = 0
    let reservados = 0

    listaReservas.forEach((data) => {
        const status = (data.status || '').toLowerCase()

        if (status === 'vendido') vendidos++
        if (status === 'reservado') reservados++

        let dataFormatada = '-'
        let horaFormatada = '-'

        if (data.createdAt) {
            const dataFirebase = new Date(data.createdAt)

            dataFormatada = dataFirebase.toLocaleDateString('pt-BR')
            horaFormatada = dataFirebase.toLocaleTimeString('pt-BR')
        }

        const div = document.createElement('div')

        div.style.border = '1px solid #ccc'
        div.style.padding = '10px'
        div.style.marginBottom = '20px'
        div.style.borderRadius = '8px'

        div.innerHTML = `
<strong>NÚMERO:</strong> ${data.number}<br><br>
<strong>NOME:</strong> ${data.name}<br><br>
<strong>TURMA:</strong> ${data.turma.toUpperCase()}<br><br>
<strong>STATUS:</strong> ${data.status.toUpperCase()}<br><br>
<strong>DATA:</strong> ${dataFormatada}<br><br>
<strong>HORA:</strong> ${horaFormatada}
<br><br>
<button onclick="confirmar('${data.id}')">Confirmar pagamento</button>
<button onclick="cancelar('${data.id}')">Cancelar</button>
`

        lista.appendChild(div)
    })

    const disponiveis = 150 - vendidos - reservados

    stats.innerHTML = `
<p>Vendidos: <strong>${vendidos}</strong></p>
<p>Reservados: <strong>${reservados}</strong></p>
<p>Disponíveis: <strong>${disponiveis}</strong></p>
`
}

window.confirmar = async function (id) {
    try {
        await updateDoc(doc(db, 'rifa', id), {
            status: 'VENDIDO'
        })

        alert('Pagamento confirmado!')
    } catch (error) {
        console.error(error)
        alert('Erro ao confirmar pagamento.')
    }
}

window.cancelar = async function (id) {
    const confirmar = confirm('Tem certeza que deseja cancelar esta reserva?')

    if (!confirmar) return

    try {
        await deleteDoc(doc(db, 'rifa', id))

        alert('Reserva cancelada!')
    } catch (error) {
        console.error(error)
        alert('Erro ao cancelar reserva.')
    }
}

searchInput.addEventListener('input', () => {
    const termo = searchInput.value.toUpperCase()

    const filtrados = reservas.filter((r) =>
        r.name.toUpperCase().includes(termo) ||
        String(r.number).includes(termo)
    )

    renderizarReservas(filtrados)
})

escutarReservas()