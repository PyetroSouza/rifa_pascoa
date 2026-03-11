/***************************************************************************
 * Objetivo: Arquivo responsável por toda a lógica do painel administrativo.
 * Data: 05/03/2026 (quinta-feira)
 * Autores:
    - Gustavo Vidal de Abreu
    - Kauan Alves Pereira
    - Kayque Brenno Ferreira Almeida
    - Pyetro Ferreira de Souza
 * Versão: 4.0
****************************************************************************/

'use strict'

// Importações Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'
import {
    getFirestore,
    collection,
    onSnapshot,
    updateDoc,
    doc,
    deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'

// Configurações do Firebase
const firebaseConfig = {
    apiKey: 'AIzaSyByikN6_CXfiJnb1_0ppP60oBQxN8zVxYA',
    authDomain: 'site-para-rifa-de-pascoa-25745.firebaseapp.com',
    projectId: 'site-para-rifa-de-pascoa-25745',
    storageBucket: 'site-para-rifa-de-pascoa-25745.appspot.com',
    messagingSenderId: '1004843167683',
    appId: '1:1004843167683:web:93211e8925926723c3d776'
}

// Inicialização Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

// Elementos DOM
const listaReservados = document.getElementById('listaReservados')
const listaVendidos = document.getElementById('listaVendidos')
const stats = document.getElementById('stats')
const searchInput = document.getElementById('searchInput')

// Variáveis globais
let reservas = []
let termoBusca = ''

// LOGIN ADMIN
async function loginAdmin() {
    const email = prompt('Digite o email do administrador:')
    const senha = prompt('Digite a senha do administrador:')

    try {
        await signInWithEmailAndPassword(auth, email, senha)
    } catch (error) {
        alert('Login incorreto.')
        window.location.href = '../index.html'
    }
}

// VERIFICAR AUTENTICAÇÃO
onAuthStateChanged(auth, (user) => {
    if (!user)
        loginAdmin()
    else
        escutarReservas()
})

// ESCUTAR RESERVAS FIREBASE
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

// SISTEMA FECHADO
function sistemaFechado() {
    const agora = new Date()

    const hora = agora.getHours()
    const minuto = agora.getMinutes()

    const minutos = hora * 60 + minuto

    const inicio = 7 * 60 + 30
    const fim = 22 * 60

    return minutos < inicio || minutos >= fim
}

// RENDERIZAR RESERVAS
function renderizarReservas(listaReservas) {
    listaReservados.innerHTML = ''
    listaVendidos.innerHTML = ''

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

        let tempoRestanteHTML = ''

        if (status === 'reservado' && data.expiresAt) {
            if (sistemaFechado()) {
                tempoRestanteHTML = `
                <div class="tempo" style="color: orange; font-weight: bold;">
                Retoma às 07:30 ⏸
                <br>
                30 min após a retomada
                </div>
                <br>
                `
            } else {
                const agora = Date.now()
                const tempoRestante = data.expiresAt - agora

                if (tempoRestante > 0) {
                    const minutos = Math.floor(tempoRestante / 60000)
                    const segundos = Math.floor((tempoRestante % 60000) / 1000)

                    let cor = 'green'

                    if (tempoRestante < 300000) {
                        cor = 'red'
                    } else if (tempoRestante < 600000) {
                        cor = 'orange'
                    }

                    tempoRestanteHTML = `
                    <div class="tempo" style="color:${cor}; font-weight:bold;">
                    ⏱️ Expira em: ${minutos}:${segundos.toString().padStart(2, '0')}
                    </div>
                    <br>
                    `
                } else {
                    tempoRestanteHTML = `
                    <div class="tempo" style="color:red; font-weight:bold;">
                    ⏱️ EXPIRADO
                    </div>
                    <br>
                    `
                }
            }
        }

        const div = document.createElement('div')

        div.style.border = '1px solid #ccc'
        div.style.padding = '10px'
        div.style.marginBottom = '20px'
        div.style.borderRadius = '8px'

        let botoes = `
        <button onclick="cancelar('${data.id}')">Cancelar</button>
        `

        if (status === 'reservado') {
            botoes = `
            <button onclick="confirmar('${data.id}')">Confirmar pagamento</button>
            <button onclick="cancelar('${data.id}')">Cancelar</button>
            `
        }

        div.innerHTML = `
        ${tempoRestanteHTML}
        <strong>NÚMERO:</strong> ${data.number}<br><br>
        <strong>NOME:</strong> ${data.name}<br><br>
        <strong>TURMA:</strong> ${data.turma.toUpperCase()}<br><br>
        <strong>STATUS:</strong> ${data.status.toUpperCase()}<br><br>
        <strong>DATA:</strong> ${dataFormatada}<br><br>
        <strong>HORA:</strong> ${horaFormatada}
        <br><br>
        ${botoes}
        `

        if (status === 'vendido')
            listaVendidos.appendChild(div)
        else if (status === 'reservado')
            listaReservados.appendChild(div)
    })

    const disponiveis = 150 - vendidos - reservados

    stats.innerHTML = `
    <p>Vendidos: <strong>${vendidos}</strong></p>
    <p>Reservados: <strong>${reservados}</strong></p>
    <p>Disponíveis: <strong>${disponiveis}</strong></p>
    `
}

// CONFIRMAR PAGAMENTO
window.confirmar = async function (id) {
    try {
        await updateDoc(doc(db, 'rifa', id), {
            status: 'vendido'
        })
        alert('Pagamento confirmado!')
    } catch (error) {
        console.error(error)
        alert('Erro ao confirmar pagamento.')
    }
}

// CANCELAR RESERVA
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

// BUSCA
searchInput.addEventListener('input', () => {
    termoBusca = searchInput.value.toUpperCase()

    const filtrados = reservas.filter((r) =>
        (r.name || '').toUpperCase().includes(termoBusca) ||
        String(r.number || '').includes(termoBusca)
    )

    renderizarReservas(filtrados)
})

// TIMER GLOBAL
setInterval(() => {
    const filtrados = reservas.filter((r) =>
        (r.name || '').toUpperCase().includes(termoBusca) ||
        String(r.number || '').includes(termoBusca)
    )

    renderizarReservas(filtrados)
}, 1000)