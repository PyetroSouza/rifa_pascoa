/*******************************************************************************
 * Objetivo: Arquivo responsável por toda a lógica do site de pagamento da rifa.
 * Data: 04/03/2026 (quarta-feira)
 * Autores:
    - Gustavo Vidal de Abreu
    - Kauan Alves Pereira
    - Kayque Brenno Ferreira Almeida
    - Pyetro Ferreira de Souza
 * Versão: 3.0
********************************************************************************/

'use strict'

const numeros = JSON.parse(localStorage.getItem('numeros')) || []
const nome = localStorage.getItem('nome') || ''
const turma = localStorage.getItem('turma') || ''
const createdAt = Number(localStorage.getItem('createdAt') || 0)

if (!createdAt || numeros.length === 0) {
    window.location.href = "../index.html"
}

const total = (numeros.length * 3.5).toFixed(2)

document.getElementById('numConfirmado').innerText = numeros.join(', ')
document.getElementById('nomeConfirmado').innerText = nome
document.getElementById('turmaConfirmada').innerText = turma
document.getElementById('valorFinal').innerText = total

const mensagem = `Olá, Manuela! Comprei os números ${numeros.join(', ')}.
Nome: ${nome}
Turma: ${turma}
Total: R$ ${total}`

document.getElementById('btnWhatsapp').onclick = function () {
    const url = `https://wa.me/5511946168749?text=${encodeURIComponent(mensagem)}`
    window.location.href = url
}

const timer = document.getElementById("timer")

const TEMPO_EXPIRACAO = 30 * 60 * 1000
const expiresAt = createdAt + TEMPO_EXPIRACAO

let intervalo

function atualizarTempo() {
    const agora = Date.now()
    const restante = expiresAt - agora

    if (restante <= 0) {
        clearInterval(intervalo)

        timer.innerText = "Reserva expirada"

        localStorage.removeItem('numeros')
        localStorage.removeItem('nome')
        localStorage.removeItem('turma')
        localStorage.removeItem('createdAt')

        setTimeout(() => {
            window.location.href = "../index.html"
        }, 3000)

        return
    }

    const minutos = Math.floor(restante / 60000)
    const segundos = Math.floor((restante % 60000) / 1000)

    timer.innerText = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
}

intervalo = setInterval(atualizarTempo, 1000)
atualizarTempo()

function showToast(msg, type = 'success', duration = 3000) {
    let toast = document.createElement('div')

    toast.className = `toast ${type}`
    toast.innerText = msg

    document.body.appendChild(toast)

    setTimeout(() => toast.classList.add('show'), 100)

    setTimeout(() => {
        toast.classList.remove('show')
        setTimeout(() => document.body.removeChild(toast), 300)
    }, duration)
}

function copiarPix() {
    const chave = document.getElementById('pixKey').innerText
    const botao = document.getElementById('btnPix')

    navigator.clipboard.writeText(chave)
        .then(() => {
            showToast('Chave Pix copiada!', 'success')

            botao.innerText = 'Copiado ✓'

            setTimeout(() => {
                botao.innerText = 'Copiar'
            }, 2000)
        })
        .catch(() => {
            showToast('Erro ao copiar chave Pix', 'error')
        })
}

window.copiarPix = copiarPix