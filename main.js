/***************************************************************************
 * Objetivo: Arquivo responsável por toda a lógica do site de venda da rifa.
 * Data: 04/03/2026 (quarta-feira)
 * Autores:
    - Gustavo Vidal de Abreu
    - Kauan Alves Pereira
    - Kayque Brenno Ferreira Almeida
    - Pyetro Ferreira de Souza
 * Versão: 2.8
***************************************************************************/

'use strict'

// Importações Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'
import {
    getFirestore,
    collection,
    onSnapshot,
    doc,
    runTransaction,
    deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'

// Configurações do Firebase
const firebaseConfig = {
    apiKey: 'AIzaSyByikN6_CXfiJnb1_0ppP60oBQxN8zVxYA',
    authDomain: 'site-para-rifa-de-pascoa-25745.firebaseapp.com',
    projectId: 'site-para-rifa-de-pascoa-25745',
    storageBucket: 'site-para-rifa-de-pascoa-25745.firebasestorage.app',
    messagingSenderId: '1004843167683',
    appId: '1:1004843167683:web:93211e8925926723c3d776'
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// DOM
const numbersContainer = document.getElementById('numbers')
const counter = document.getElementById('counter')
const summary = document.getElementById('summary')
const buyBtn = document.getElementById('buyBtn')

// CAMPO NOME
const campoNome = document.getElementById('name')

// FORÇAR NOME EM MAIÚSCULO
campoNome.addEventListener('input', function () {
    let nome = this.value

    nome = nome.replace(/[^A-Za-zÀ-ÿ\s]/g, '')
    nome = nome.toUpperCase()

    this.value = nome
})

// CONFIG
const TEMPO_EXPIRACAO = 30 * 60 * 1000

const STATUS = {
    RESERVADO: "reservado",
    VENDIDO: "vendido"
}

// ESTADO
let soldNumbers = new Set()
let reservedNumbers = new Set()
let selectedNumbers = []
let comprando = false

// CALCULAR EXPIRAÇÃO
function calcularExpiracao() {
    const agora = new Date()

    const inicio = new Date()
    inicio.setHours(7, 30, 0, 0)

    const fim = new Date()
    fim.setHours(22, 0, 0, 0)

    if (agora < inicio) {
        return inicio.getTime() + TEMPO_EXPIRACAO
    }

    if (agora >= fim) {
        const proximoDia = new Date(inicio)
        proximoDia.setDate(proximoDia.getDate() + 1)

        return proximoDia.getTime() + TEMPO_EXPIRACAO
    }

    const expiracao = new Date(agora)
    expiracao.setMinutes(expiracao.getMinutes() + 30)

    if (expiracao > fim) {
        const proximoDia = new Date(inicio)
        proximoDia.setDate(proximoDia.getDate() + 1)

        return proximoDia.getTime() + TEMPO_EXPIRACAO
    }

    return expiracao.getTime()
}

// BARRA DE PROGRESSO
function atualizarBarra(ocupados, total) {
    const porcentagem = Math.round((ocupados / total) * 100);

    document.getElementById("progresso").style.width = porcentagem + "%";
    document.getElementById("porcentagem").innerText = porcentagem + "% Ocupados";
}

// CONTADOR REGRESSIVO
function iniciarContador() {
    const dataSorteio = new Date("2026-04-03T00:00:00").getTime()

    const intervalo = setInterval(() => {
        const agora = new Date().getTime()

        const distancia = dataSorteio - agora

        const dias = Math.floor(distancia / (1000 * 60 * 60 * 24))
        const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60))
        const segundos = Math.floor((distancia % (1000 * 60)) / 1000)

        document.getElementById("days").innerText = dias
        document.getElementById("hours").innerText = horas
        document.getElementById("minutes").innerText = minutos
        document.getElementById("seconds").innerText = segundos

        if (distancia < 0) {
            clearInterval(intervalo)
            document.getElementById("countdown").innerHTML = "🎉 SORTEIO ENCERRADO!"
            animacaoSorteio()
        }
    }, 1000)
}

iniciarContador()

// CONFETES
function confete() {
    for (let i = 0; i < 120; i++) {
        const confete = document.createElement("div")
        confete.classList.add("confete")

        const cores = [
            "#ff0000",
            "#ffd700",
            "#22c55e",
            "#3b82f6",
            "#ff69b4"
        ]

        confete.style.background = cores[Math.floor(Math.random() * cores.length)]

        confete.style.left = Math.random() * 100 + "vw"

        confete.style.animationDuration = (Math.random() * 3 + 3) + "s"

        confete.style.width = (Math.random() * 8 + 4) + "px"
        confete.style.height = confete.style.width

        document.body.appendChild(confete)

        setTimeout(() => {
            confete.remove()
        }, 6000)
    }
}

// ANIMAÇÃO SORTEIO
function animacaoSorteio() {
    const numeros = document.querySelectorAll(".number")

    let velocidade = 50
    let rodadas = numeros.length * 3
    let atual = 0

    const intervalo = setInterval(() => {
        numeros.forEach(n => {
            n.style.background = ""
            n.style.color = ""
        })

        numeros[atual].style.background = "#ffd700"
        numeros[atual].style.color = "#000"

        atual++

        if (atual >= numeros.length) atual = 0

        rodadas--

        if (rodadas <= 0) {
            clearInterval(intervalo)

            const vencedor = Math.floor(Math.random() * numeros.length)

            numeros[vencedor].style.background = "#22c55e"
            numeros[vencedor].style.color = "#fff"

            confete()
        }
    }, velocidade)
}

// CARREGAR NÚMEROS
function loadNumbers() {
    onSnapshot(collection(db, 'rifa'), async (querySnapshot) => {
        if (comprando) return
        soldNumbers = new Set()
        reservedNumbers = new Set()

        const agora = Date.now()

        for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data()
            const status = (data.status || "").toLowerCase()
            const numero = Number(data.number)

            if (status === STATUS.RESERVADO) {
                if (data.expiresAt && agora > data.expiresAt) {
                    // REMOVE RESERVA EXPIRADA
                    await deleteDoc(doc(db, 'rifa', numero.toString()))
                    continue
                }

                reservedNumbers.add(numero)
            } else if (status === STATUS.VENDIDO) {
                soldNumbers.add(numero)
            }
        }

        createNumbers()
        updateCounter()
    })
}

// CRIAR NÚMEROS
function createNumbers() {
    numbersContainer.innerHTML = ''

    const fragment = document.createDocumentFragment()

    for (let i = 1; i <= 150; i++) {
        const div = document.createElement('div')

        div.classList.add('number')
        div.innerText = i

        if (soldNumbers.has(i))
            div.classList.add('sold')
        else if (reservedNumbers.has(i))
            div.classList.add('reserved')

        if (selectedNumbers.includes(i)) div.classList.add('selected')

        div.addEventListener('click', () => {
            if (soldNumbers.has(i) || reservedNumbers.has(i)) {
                showToast("Esse número já está reservado ou vendido.")
                return
            }

            if (selectedNumbers.includes(i)) {
                selectedNumbers = selectedNumbers.filter(n => n !== i)
                div.classList.remove('selected')
            } else {
                selectedNumbers.push(i)
                div.classList.add('selected')
            }

            updateSummary()
        })

        fragment.appendChild(div)
    }

    numbersContainer.appendChild(fragment)
}

// COPIAR PIX
function copiarPix() {
    const chave = document.getElementById("pixKey").innerText;

    navigator.clipboard.writeText(chave)
        .then(() => {
            showToast("Chave PIX copiada!");
        })
        .catch(() => {
            showToast("Erro ao copiar a chave PIX.");
        });
}

window.copiarPix = copiarPix

// RESUMO
function updateSummary() {
    if (selectedNumbers.length === 0) {
        summary.innerText = 'Nenhum número selecionado.'
        return
    }

    const total = (selectedNumbers.length * 3.5).toFixed(2)

    summary.innerHTML = `
    Números: <strong>${selectedNumbers.join(', ')}</strong><br>
    Total: <strong>R$ ${total}</strong>
    `
}

// CONTADOR
function updateCounter() {
    const vendidos = soldNumbers.size
    const reservados = reservedNumbers.size
    const disponiveis = 150 - vendidos - reservados

    counter.innerText = `Disponíveis: ${disponiveis} | Reservados: ${reservados} | Vendidos: ${vendidos}`

    const ocupados = vendidos + reservados
    atualizarBarra(ocupados, 150)
}

// TOAST
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

// RESERVAR
buyBtn.addEventListener('click', async () => {
    const name = document.getElementById('name').value.trim()
    const turma = document.getElementById('turma').value.trim()

    if (selectedNumbers.length === 0) return showToast('Selecione um número.')

    if (!name) return showToast('Digite seu nome.')

    if (!turma) return showToast('Escolha sua turma.')

    buyBtn.disabled = true

    try {
        for (let number of selectedNumbers) {
            const ref = doc(db, 'rifa', number.toString())

            await runTransaction(db, async (transaction) => {
                const snap = await transaction.get(ref)

                if (snap.exists()) {
                    const data = snap.data()
                    const status = (data.status || "").toLowerCase()

                    if (status === STATUS.VENDIDO) throw new Error()
                    if (status === STATUS.RESERVADO && Date.now() < data.expiresAt) throw new Error()

                    transaction.delete(ref)
                }

                transaction.set(ref, {
                    name,
                    turma,
                    number,
                    status: STATUS.RESERVADO,
                    createdAt: Date.now(),
                    expiresAt: calcularExpiracao()
                })
            })
        }

        localStorage.setItem('numeros', JSON.stringify(selectedNumbers))
        localStorage.setItem('nome', name)
        localStorage.setItem('turma', turma)
        localStorage.setItem('createdAt', Date.now())

        comprando = true

        confete()

        setTimeout(() => {
            window.location.href = './pages/pagamento.html'
        }, 2000)
    } catch {
        showToast('Um dos números já foi reservado.')
        buyBtn.disabled = false
    }
})

// iniciar
loadNumbers()