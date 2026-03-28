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

// Firebase
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

// Config
const firebaseConfig = {
    apiKey: 'AIzaSyByikN6_CXfiJnb1_0ppP60oBQxN8zVxYA',
    authDomain: 'site-para-rifa-de-pascoa-25745.firebaseapp.com',
    projectId: 'site-para-rifa-de-pascoa-25745',
    storageBucket: 'site-para-rifa-de-pascoa-25745.appspot.com',
    messagingSenderId: '1004843167683',
    appId: '1:1004843167683:web:93211e8925926723c3d776'
}

// Init
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

// DOM
const listaReservados = document.getElementById('listaReservados')
const listaVendidos = document.getElementById('listaVendidos')
const stats = document.getElementById('stats')
const searchInput = document.getElementById('searchInput')

const qtdeNumeros = 160

let reservas = []
let termoBusca = ''

// LOGIN
async function loginAdmin() {
    const email = prompt('Email:')
    const senha = prompt('Senha:')

    try {
        await signInWithEmailAndPassword(auth, email, senha)
    } catch {
        alert('Login incorreto.')
        window.location.href = '../../index.html'
    }
}

onAuthStateChanged(auth, (user) => {
    if (!user) loginAdmin()
    else escutarReservas()
})

// FIREBASE
function escutarReservas() {
    onSnapshot(collection(db, 'rifa'), (snapshot) => {
        reservas = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
        }))

        reservas.sort((a, b) => a.number - b.number)

        render()
    })
}

// SISTEMA
function sistemaFechado() {
    const agora = new Date()
    const minutos = agora.getHours() * 60 + agora.getMinutes()

    return minutos < (7 * 60 + 30) || minutos >= (22 * 60)
}

// RENDER PRINCIPAL
function render() {
    const filtrados = reservas.filter(r =>
        (r.name || '').toUpperCase().includes(termoBusca) ||
        String(r.number || '').includes(termoBusca)
    )

    renderizarReservas(filtrados)
}

// RENDER LISTA
function renderizarReservas(lista) {
    listaReservados.replaceChildren()
    listaVendidos.replaceChildren()

    let vendidos = 0
    let reservados = 0

    lista.forEach(data => {
        const status = (data.status || '').toLowerCase()

        if (status === 'vendido') vendidos++
        if (status === 'reservado') reservados++

        const div = document.createElement('div')
        div.style.cssText = `
            border:1px solid #ccc;
            padding:10px;
            margin-bottom:20px;
            border-radius:8px;
        `

        // TEMPO
        if (status === 'reservado' && data.expiresAt) {
            const tempoDiv = document.createElement('div')
            tempoDiv.className = 'tempo'
            tempoDiv.style.fontWeight = 'bold'

            if (sistemaFechado()) {
                tempoDiv.style.color = 'orange'
                tempoDiv.append(
                    'Retoma às 07:30 ⏸',
                    document.createElement('br'),
                    '30 min após a retomada'
                )
            } else {
                const restante = data.expiresAt - Date.now()

                if (restante > 0) {
                    const m = Math.floor(restante / 60000)
                    const s = Math.floor((restante % 60000) / 1000)

                    let cor = 'green'
                    if (restante < 300000) cor = 'red'
                    else if (restante < 600000) cor = 'orange'

                    tempoDiv.style.color = cor
                    tempoDiv.textContent = `⏱️ ${m}:${String(s).padStart(2, '0')}`
                } else {
                    tempoDiv.style.color = 'red'
                    tempoDiv.textContent = '⏱️ EXPIRADO'
                }
            }

            div.appendChild(tempoDiv)
            div.appendChild(document.createElement('br'))
        }

        // DADOS
        function linha(label, valor) {
            const strong = document.createElement('strong')
            strong.textContent = label

            div.append(strong, ` ${valor}`, document.createElement('br'), document.createElement('br'))
        }

        const dataObj = data.createdAt ? new Date(data.createdAt) : null

        linha('NÚMERO:', data.number)
        linha('NOME:', data.name)
        linha('TURMA:', (data.turma || '').toUpperCase())
        linha('STATUS:', (data.status || '').toUpperCase())
        linha('DATA:', dataObj ? dataObj.toLocaleDateString('pt-BR') : '-')
        linha('HORA:', dataObj ? dataObj.toLocaleTimeString('pt-BR') : '-')

        // BOTÕES
        const btnContainer = document.createElement('div')

        const criarBtn = (txt, fn) => {
            const b = document.createElement('button')
            b.textContent = txt
            b.addEventListener('click', fn)
            return b
        }

        if (status === 'reservado') {
            btnContainer.appendChild(
                criarBtn('Confirmar pagamento', () => confirmar(data.id))
            )
        }

        btnContainer.appendChild(
            criarBtn('Cancelar', () => cancelar(data.id))
        )

        div.appendChild(btnContainer)

        if (status === 'vendido')
            listaVendidos.appendChild(div)
        else if (status === 'reservado')
            listaReservados.appendChild(div)
    })

    renderStats(vendidos, reservados)
}

// STATS
function renderStats(vendidos, reservados) {
    const disponiveis = qtdeNumeros - vendidos - reservados

    stats.replaceChildren()

    function item(label, valor) {
        const p = document.createElement('p')
        const strong = document.createElement('strong')
        strong.textContent = valor
        p.append(label + ' ', strong)
        return p
    }

    stats.appendChild(item('Vendidos:', vendidos))
    stats.appendChild(item('Reservados:', reservados))
    stats.appendChild(item('Disponíveis:', disponiveis))
}

// AÇÕES
async function confirmar(id) {
    try {
        await updateDoc(doc(db, 'rifa', id), { status: 'vendido' })
        alert('Pagamento confirmado!')
    } catch {
        alert('Erro ao confirmar.')
    }
}

async function cancelar(id) {
    if (!confirm('Cancelar reserva?')) return

    try {
        await deleteDoc(doc(db, 'rifa', id))
        alert('Cancelado!')
    } catch {
        alert('Erro ao cancelar.')
    }
}

// BUSCA
searchInput.addEventListener('input', () => {
    termoBusca = searchInput.value.toUpperCase()
    render()
})

// TIMER (ainda simples, mas funcional)
setInterval(render, 1000)