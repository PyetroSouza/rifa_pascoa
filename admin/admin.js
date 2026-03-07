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

function showToast(msg, duration = 3000) {
    let toast = document.createElement('div')

    toast.className = 'toast'
    toast.innerText = msg

    document.body.appendChild(toast)

    setTimeout(() => toast.classList.add('show'), 100)

    setTimeout(() => {
        toast.classList.remove('show')
        setTimeout(() => document.body.removeChild(toast), 300)
    }, duration)
}

function escutarReservas() {
    onSnapshot(collection(db, 'rifa'), (snapshot) => {
        reservas = []

        snapshot.forEach((docSnap) => {

            reservas.push({
                id: docSnap.id,
                ...docSnap.data()
            })

        })

        // ordenar números
        reservas.sort((a, b) => a.number - b.number)

        renderizarReservas(reservas)
    })
}

function renderizarReservas(listaReservas) {
    lista.innerHTML = ''

    let vendidos = 0
    let reservados = 0

    listaReservas.forEach((data) => {
        if (data.status === 'VENDIDO') vendidos++
        if (data.status === 'reservado') reservados++

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
<strong>Número:</strong> ${data.number}<br><br>
<strong>Nome:</strong> ${data.name}<br><br>
<strong>Turma:</strong> ${data.turma}<br><br>
<strong>Status:</strong> ${data.status}<br><br>
<strong>Data:</strong> ${dataFormatada}<br><br>
<strong>Hora:</strong> ${horaFormatada}
<br><br>
<button onclick="confirmar('${data.id}')">Confirmar pagamento</button>
<button onclick="cancelar('${data.id}')">Cancelar</button>
`

        lista.appendChild(div)
    })

    stats.innerHTML = `
<p>Vendidos: <strong>${vendidos}</strong></p>
<p>Reservados: <strong>${reservados}</strong></p>
<p>Disponíveis: <strong>${150 - vendidos - reservados}</strong></p>
`
}

window.confirmar = async function (id) {
    try {
        await updateDoc(doc(db, 'rifa', id), {
            status: 'VENDIDO'
        })

        showToast('Pagamento confirmado!')
    } catch (error) {
        console.error(error)
        showToast('Erro ao confirmar pagamento.')
    }
}

window.cancelar = async function (id) {
    const confirmar = confirm('Tem certeza que deseja cancelar esta reserva?')

    if (!confirmar) return

    try {
        await deleteDoc(doc(db, 'rifa', id))

        showToast('Reserva cancelada!')
    } catch (error) {
        console.error(error)
        showToast('Erro ao cancelar reserva.')
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