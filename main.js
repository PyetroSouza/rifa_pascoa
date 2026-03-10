/***************************************************************************
 * Objetivo: Arquivo responsável por toda a lógica do site de venda da rifa.
 * Data: 04/03/2026 (quarta-feira)
 * Autores:
    - Gustavo Vidal de Abreu
    - Kauan Alves Pereira
    - Kayque Brenno Ferreira Almeida
    - Pyetro Ferreira de Souza
 * Versão: 2.7
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

// Inicialização Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Elementos DOM
const numbersContainer = document.getElementById('numbers')
const counter = document.getElementById('counter')
const summary = document.getElementById('summary')
const buyBtn = document.getElementById('buyBtn')

// Variáveis globais
const TEMPO_EXPIRACAO = 30 * 60 * 1000

// Variáveis para controle de números
let soldNumbers = new Set()
let selectedNumbers = []
let comprando = false
let reservedNumbers = new Set()

function calcularExpiracao() {
    const agora = new Date()

    const inicio = new Date()
    inicio.setHours(7, 30, 0, 0)

    const fim = new Date()
    fim.setHours(22, 0, 0, 0)

    // antes de abrir
    if (agora < inicio) {
        return inicio.getTime() + TEMPO_EXPIRACAO
    }

    // depois de fechar
    if (agora >= fim) {
        const proximoDia = new Date(inicio)
        proximoDia.setDate(proximoDia.getDate() + 1)

        return proximoDia.getTime() + TEMPO_EXPIRACAO
    }

    // horário normal
    const expiracao = new Date(agora)
    expiracao.setMinutes(expiracao.getMinutes() + 30)

    // se ultrapassar 22:00
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

    document.getElementById("porcentagem").innerText =
        porcentagem + "% Vendidos";

}

// CONTADOR REGRESSIVO
function iniciarContador() {
    const dataSorteio = new Date("April 3, 2026 0:00:00").getTime()

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

            document.getElementById("countdown").innerHTML =
                "🎉 SORTEIO ENCERRADO!"

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

        confete.style.background =
            cores[Math.floor(Math.random() * cores.length)]

        confete.style.left = Math.random() * 100 + "vw"

        confete.style.animationDuration =
            (Math.random() * 3 + 3) + "s"

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
    let rodadas = 40
    let atual = 0

    const intervalo = setInterval(() => {
        numeros.forEach(n => {
            n.style.background = ""
            n.style.color = ""
        })

        numeros[atual].style.background = "#ffd700"
        numeros[atual].style.color = "#000"

        atual++

        if (atual >= numeros.length) {
            atual = 0
        }

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

// FUNÇÕES PRINCIPAIS
function loadNumbers() {
    onSnapshot(collection(db, 'rifa'), async (querySnapshot) => {
        if (comprando) return

        soldNumbers = new Set()
        reservedNumbers = new Set()
        const agora = Date.now()

        for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data()

            if (agora > data.expiresAt && data.status === "reservado") {
                await deleteDoc(doc(db, 'rifa', docSnap.id))
                continue
            } else {
                if (data.status === "reservado") {
                    reservedNumbers.add(Number(data.number))
                }

                if (data.status === "VENDIDO") {
                    soldNumbers.add(Number(data.number))
                }
            }
        }

        createNumbers()
        updateCounter()
    })
}

// AJUSTAR EXPIRAÇÃO PARA FUSO HORÁRIO
function createNumbers() {
    numbersContainer.innerHTML = ''

    const fragment = document.createDocumentFragment()

    for (let i = 1; i <= 150; i++) {
        const div = document.createElement('div')

        div.classList.add('number')
        div.innerText = i

        if (reservedNumbers.has(i)) {
            div.classList.add('reserved')
        }

        if (soldNumbers.has(i)) {
            div.classList.add('sold')
        }

        if (selectedNumbers.includes(i)) {
            div.classList.add('selected')
        }

        div.addEventListener('click', () => {
            if (soldNumbers.has(i)) {
                div.classList.add("sold-click")
                setTimeout(() => {
                    div.classList.remove("sold-click")
                }, 300)
                showToast("Esse número já foi vendido.")
                return
            }

            if (reservedNumbers.has(i)) {
                div.classList.add("sold-click")
                setTimeout(() => {
                    div.classList.remove("sold-click")
                }, 300)
                showToast("Esse número já está reservado.")
                return
            }

            div.style.transform = "scale(1.2)"

            setTimeout(() => {
                div.style.transform = ""
            }, 120)

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

function updateCounter() {
    const ocupados = soldNumbers.size + reservedNumbers.size
    const disponiveis = 150 - ocupados

    counter.innerText = `Disponíveis: ${disponiveis} | Ocupados: ${ocupados}`

    atualizarBarra(ocupados, 150)
}

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

// COPIAR CHAVE PIX
function copiarPix() {
    const chave = document.getElementById('pixKey').innerText

    navigator.clipboard.writeText(chave)
        .then(() => showToast('Chave Pix copiada!'))
        .catch(() => showToast('Erro ao copiar chave Pix'))
}

window.copiarPix = copiarPix

// FUNCIONALIDADE DO BOTÃO DE RESERVAR NÚMEROS
buyBtn.addEventListener('click', async () => {
    const name = document.getElementById('name').value.trim()
    const turma = document.getElementById('turma').value.trim()

    const nomeInput = document.getElementById('name')
    const nomeSemNum = nomeInput.value.trim()

    if (selectedNumbers.length === 0) return showToast('Selecione pelo menos um número.')

    if (!/^[A-Za-zÀ-ÿ\s]+$/.test(nomeSemNum)) {
        nomeInput.value = ''
        nomeInput.focus()
        return showToast('Digite seu nome.')
    }

    if (!name) return showToast('Digite seu nome.')

    if (!turma) return showToast('Escolha sua turma e turno.')

    buyBtn.disabled = true

    try {
        for (let number of selectedNumbers) {
            const ref = doc(db, 'rifa', number.toString())

            await runTransaction(db, async (transaction) => {
                const snap = await transaction.get(ref)

                if (snap.exists()) {
                    const data = snap.data()

                    if (data.status === "VENDIDO") {
                        throw new Error("Número já vendido")
                    }

                    if (data.status === "reservado" && Date.now() < data.expiresAt) {
                        throw new Error("Número já reservado")
                    }

                    transaction.delete(ref)
                }

                transaction.set(ref, {
                    name,
                    turma,
                    number,
                    status: 'reservado',
                    createdAt: Date.now(),
                    expiresAt: calcularExpiracao()
                })
            })
        }

        localStorage.setItem('numeros', JSON.stringify(selectedNumbers))
        localStorage.setItem('nome', name)
        localStorage.setItem('turma', turma)
        localStorage.setItem('createdAt', Date.now())

        confete()
        comprando = true
        setTimeout(() => {
            window.location.href = './pages/pagamento.html'
        }, 1200)
    } catch (e) {
        showToast('Um dos números já foi reservado por outra pessoa.')
        buyBtn.disabled = false
    }
})

const campoNome = document.getElementById('name')

// MÁSCARA PARA O NOME
campoNome.addEventListener('input', function () {
    let nome = this.value

    nome = nome.replace(/[^A-Za-zÀ-ÿ\s]/g, '')
    nome = nome.toUpperCase()

    nome = nome.split(' ').map(palavra => {
        if (palavra.length > 0) {
            return palavra.charAt(0).toUpperCase() + palavra.slice(1)
        }

        return ''
    }).join(' ')

    this.value = nome
})

loadNumbers()