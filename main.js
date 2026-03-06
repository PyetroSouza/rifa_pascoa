'use strict'

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyByikN6_CXfiJnb1_0ppP60oBQxN8zVxYA",
    authDomain: "site-para-rifa-de-pascoa-25745.firebaseapp.com",
    projectId: "site-para-rifa-de-pascoa-25745",
    storageBucket: "site-para-rifa-de-pascoa-25745.firebasestorage.app",
    messagingSenderId: "1004843167683",
    appId: "1:1004843167683:web:93211e8925926723c3d776"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const numbersContainer = document.getElementById("numbers")
const counter = document.getElementById("counter")
const summary = document.getElementById("summary")
const buyBtn = document.getElementById("buyBtn")

let soldNumbers = []
let selectedNumbers = []

async function loadNumbers() {
    const querySnapshot = await getDocs(collection(db, "rifa"))

    querySnapshot.forEach(doc => {
        soldNumbers.push(doc.data().number)
    })

    createNumbers()
    updateCounter()
}

function createNumbers() {
    for (let i = 1; i <= 150; i++) {
        const div = document.createElement("div")

        div.classList.add("number")
        div.innerText = i

        if (soldNumbers.includes(i)) {
            div.classList.add("sold")
        }

        div.addEventListener("click", () => {
            if (soldNumbers.includes(i)) return

            if (selectedNumbers.includes(i)) {
                selectedNumbers = selectedNumbers.filter(n => n !== i)
                div.classList.remove("selected")
            } else {
                selectedNumbers.push(i)
                div.classList.add("selected")

            }
            updateSummary()
        })

        numbersContainer.appendChild(div)
    }
}

function updateSummary() {
    if (selectedNumbers.length === 0) {
        summary.innerText = "Nenhum número selecionado."
        return
    }

    const total = (selectedNumbers.length * 3.5).toFixed(2)

    summary.innerHTML = `
Números: <strong>${selectedNumbers.join(", ")}</strong><br>
Total: <strong>R$ ${total}</strong>
`

}

function updateCounter() {
    counter.innerText = `Disponíveis: ${100 - soldNumbers.length} | Vendidos: ${soldNumbers.length}`
}

function showToast(msg, duration = 3000) {
    let toast = document.createElement("div")

    toast.className = "toast"
    toast.innerText = msg

    document.body.appendChild(toast)

    setTimeout(() => toast.classList.add("show"), 100)

    setTimeout(() => {
        toast.classList.remove("show")
        setTimeout(() => document.body.removeChild(toast), 300)
    }, duration)
}

function copiarPix() {
    const chave = document.getElementById("pixKey").innerText

    navigator.clipboard.writeText(chave)

    showToast("Chave Pix copiada!")
}

window.copiarPix = copiarPix

function mostrarTelaPagamento(numeros, nome, turma) {
    const total = (numeros.length * 3.5).toFixed(2)

    document.getElementById("numConfirmado").innerText = numeros.join(", ")
    document.getElementById("nomeConfirmado").innerText = nome
    document.getElementById("turmaConfirmada").innerText = turma
    document.getElementById("valorFinal").innerText = total

    document.getElementById("tela-principal").style.display = "none"
    document.getElementById("tela-pagamento").style.display = "block"

    const mensagem = `Olá, Manuela! Comprei os números ${numeros.join(", ")}.
        Nome: ${nome}
        Turma: ${turma}
        Total: R$ ${total}`

    document.getElementById("btnWhatsapp").onclick = function () {
        window.open(
            `https://wa.me/5511971254661?text=${encodeURIComponent(mensagem)}`,
            "_blank"
        )
    }
}

buyBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim()
    const turma = document.getElementById("turma").value.trim()
    const nomeInput = document.getElementById("name")
    const nomeSemNum = nomeInput.value.trim();

    if (!/^[A-Za-zÀ-ÿ\s]+$/.test(nomeSemNum)) {
        alert("Digite um nome válido (apenas letras).")

        nomeInput.value = ""
        nomeInput.focus()
        return;
    }
    if (!name) return showToast("Digite seu nome.")
    if (!turma) return showToast("Escolha sua turma e turno.")
    if (selectedNumbers.length === 0) return showToast("Selecione pelo menos um número.")

    buyBtn.disabled = true

    for (let number of selectedNumbers) {

        if (!soldNumbers.includes(number)) {
            const docRef = doc(db, "rifa", number.toString());

            const snap = await getDoc(docRef);

            if (snap.exists()) {
                showToast("Esse número já foi reservado por outra pessoa.");
                return;
            }

            await setDoc(docRef, {
                name,
                turma,
                number,
                status: "reservado",
                createdAt: Date.now()
            });
        }
    }

    mostrarTelaPagamento(selectedNumbers, name, turma)

    buyBtn.disabled = false
})


const campoNome = document.getElementById("name")

campoNome.addEventListener("input", function () {

    let nome = this.value

    nome = nome.replace(/[^A-Za-zÀ-ÿ\s]/g, "")
    nome = nome.toLowerCase();

    nome = nome.split(" ").map(palavra => {
        if (palavra.length > 0) {
            return palavra.charAt(0).toUpperCase() + palavra.slice(1)
        }
        return ""
    }).join(" ")

    this.value = nome
})

loadNumbers()