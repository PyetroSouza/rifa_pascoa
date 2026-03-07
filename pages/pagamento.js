"use strict"

const numeros = JSON.parse(localStorage.getItem("numeros")) || []
const nome = localStorage.getItem("nome") || ""
const turma = localStorage.getItem("turma") || ""

const total = (numeros.length * 3.5).toFixed(2)

document.getElementById("numConfirmado").innerText = numeros.join(", ")
document.getElementById("nomeConfirmado").innerText = nome
document.getElementById("turmaConfirmada").innerText = turma
document.getElementById("valorFinal").innerText = total

const mensagem = `Olá, Manuela! Comprei os números ${numeros.join(", ")}.
Nome: ${nome}
Turma: ${turma}
Total: R$ ${total}`

document.getElementById("btnWhatsapp").onclick = function () {
    window.open(
        `https://wa.me/5511946168749?text=${encodeURIComponent(mensagem)}`,
        "_blank"
    )
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