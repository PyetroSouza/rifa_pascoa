/*****************************************************************************************
 * Objetivo: Arquivo responsável por controlar a parte principal do site, onde os usuários
   podem selecionar os números.
 * Data: 04/03/2026 (quarta-feira)
 * Autores:
    - Gustavo Vidal de Abreu
    - Kauan Alves Pereira
    - Kayque Brenno Ferreira Almeida
    - Pyetro Ferreira de Souza
 * Versão: 2.4
*****************************************************************************************/

'use strict'

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'
import {
    getFirestore,
    collection,
    onSnapshot,
    doc,
    runTransaction,
    deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'

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

const numbersContainer = document.getElementById('numbers')
const counter = document.getElementById('counter')
const summary = document.getElementById('summary')
const buyBtn = document.getElementById('buyBtn')

const TEMPO_EXPIRACAO = 30 * 60 * 1000

let soldNumbers = []
let selectedNumbers = []

function atualizarBarra(vendidos, total) {

    const porcentagem = Math.round((vendidos / total) * 100);

    document.getElementById("progresso").style.width = porcentagem + "%";

    document.getElementById("porcentagem").innerText =
        porcentagem + "% vendido";

}
function loadNumbers() {

    onSnapshot(collection(db, 'rifa'), async (querySnapshot) => {

        soldNumbers = []
        const agora = Date.now()

        for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data()

            if (agora > data.expiresAt) {
                await deleteDoc(doc(db, 'rifa', docSnap.id))
            } else {
                soldNumbers.push(data.number)
            }
        }

        createNumbers()
        updateCounter()
    })
}
function createNumbers() {

    numbersContainer.innerHTML = ''

    const fragment = document.createDocumentFragment()

    for (let i = 1; i <= 150; i++) {

        const div = document.createElement('div')

        div.classList.add('number')
        div.innerText = i

        if (soldNumbers.includes(i)) {
            div.classList.add('sold')
        }

        if (selectedNumbers.includes(i)) {
            div.classList.add('selected')
        }

        div.addEventListener('click', () => {

            if (soldNumbers.includes(i)) return

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

    const total = (selectedNumbers.length * 4.0).toFixed(2)

    summary.innerHTML = `
Números: <strong>${selectedNumbers.join(', ')}</strong><br>
Total: <strong>R$ ${total}</strong>
`
}

function updateCounter() {

    const vendidos = soldNumbers.length
    const disponiveis = 150 - vendidos

    counter.innerText =
        `Disponíveis: ${disponiveis} | Vendidos: ${vendidos}`

    atualizarBarra(vendidos, 150)
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

function copiarPix() {
    const chave = document.getElementById('pixKey').innerText

    navigator.clipboard.writeText(chave)
        .then(() => showToast('Chave Pix copiada!'))
        .catch(() => showToast('Erro ao copiar chave Pix'))


}

window.copiarPix = copiarPix

buyBtn.addEventListener('click', async () => {
    const name = document.getElementById('name').value.trim()
    const turma = document.getElementById('turma').value.trim()

    const nomeInput = document.getElementById('name')
    const nomeSemNum = nomeInput.value.trim()

    if (selectedNumbers.length === 0)
        return showToast('Selecione pelo menos um número.')

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

                    if (Date.now() < data.expiresAt) {
                        throw new Error('Número já reservado')
                    }

                    transaction.delete(ref)
                }

                transaction.set(ref, {
                    name,
                    turma,
                    number,
                    status: 'reservado',
                    createdAt: Date.now(),
                    expiresAt: Date.now() + TEMPO_EXPIRACAO
                })
            })
        }

        localStorage.setItem('numeros', JSON.stringify(selectedNumbers))
        localStorage.setItem('nome', name)
        localStorage.setItem('turma', turma)
        localStorage.setItem('createdAt', Date.now())

        window.location.href = './pages/pagamento.html'
    } catch (e) {
        showToast('Um dos números já foi reservado por outra pessoa.')

        buyBtn.disabled = false
    }
})



const campoNome = document.getElementById('name')

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