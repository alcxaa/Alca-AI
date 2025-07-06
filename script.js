// Alca AI - Chatbot menggunakan Gemini API + Memory Percakapan (persisten)

class AlcaAI {
  constructor() {
    this.messages = []
    this.messageId = 0
    this.isTyping = false
    this.theme = localStorage.getItem("theme") || "light"
    this.conversationHistory = JSON.parse(localStorage.getItem("conversationHistory")) || []

    // Tambahkan system prompt jika belum ada
    if (this.conversationHistory.length === 0) {
      this.conversationHistory.push({
        role: "user",
        parts: [
          {
            text: "Kamu adalah Alca AI, asisten pintar yang menjawab dengan gaya fleksibel bisa gua, lu, aku, kamu dan lain-lain. Jika pertanyaan cocok dijawab dalam poin-poin (seperti alasan, langkah-langkah, daftar, tips), jawablah dengan format bullet atau numbered list, satu kalimat per poin, jelas dan padat. Namun jika pertanyaan lebih cocok dijawab dengan paragraf (misal: penjelasan mendalam, opini, sejarah, narasi), maka gunakan paragraf yang tetap ringkas dan mudah dibaca. Fokus pada kejelasan dan efisiensi dalam menyampaikan jawaban."
          }
        ]
      })
    }

    this.initializeElements()
    this.initializeTheme()
    this.bindEvents()
    this.setInitialTime()
  }

  initializeElements() {
    this.chatMessages = document.getElementById("chat-messages")
    this.userInput = document.getElementById("user-input")
    this.sendButton = document.getElementById("send-button")
    this.typingIndicator = document.getElementById("typing-indicator")
    this.themeToggle = document.getElementById("theme-toggle")
    this.themeIcon = document.getElementById("theme-icon")
    this.TentangBtn = document.getElementById("Tentang-btn")
    this.BantuanBtn = document.getElementById("Bantuan-btn")
    this.TentangModal = document.getElementById("Tentang-modal")
    this.BantuanModal = document.getElementById("Bantuan-modal")
    this.TentangClose = document.getElementById("Tentang-close")
    this.BantuanClose = document.getElementById("Bantuan-close")
  }

  initializeTheme() {
    document.documentElement.setAttribute("data-theme", this.theme)
    this.updateThemeIcon()
  }

  bindEvents() {
    this.sendButton.addEventListener("click", () => this.sendMessage())
    this.userInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.sendMessage()
      }
    })
    this.themeToggle.addEventListener("click", () => this.toggleTheme())
    this.TentangBtn.addEventListener("click", () => this.showModal("Tentang"))
    this.BantuanBtn.addEventListener("click", () => this.showModal("Bantuan"))
    this.TentangClose.addEventListener("click", () => this.hideModal("Tentang"))
    this.BantuanClose.addEventListener("click", () => this.hideModal("Bantuan"))
    this.TentangModal.addEventListener("click", (e) => {
      if (e.target === this.TentangModal) {
        this.hideModal("Tentang")
      }
    })
    this.BantuanModal.addEventListener("click", (e) => {
      if (e.target === this.BantuanModal) {
        this.hideModal("Bantuan")
      }
    })
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hideModal("Tentang")
        this.hideModal("Bantuan")
      }
    })
  }

  setInitialTime() {
    const initialTime = document.getElementById("initial-time")
    if (initialTime) {
      initialTime.textContent = this.formatTime(new Date())
    }
  }

  toggleTheme() {
    this.theme = this.theme === "light" ? "dark" : "light"
    document.documentElement.setAttribute("data-theme", this.theme)
    localStorage.setItem("theme", this.theme)
    this.updateThemeIcon()
  }

  updateThemeIcon() {
    this.themeIcon.className = this.theme === "dark" ? "fas fa-sun" : "fas fa-moon"
  }

  showModal(type) {
    const modal = type === "Tentang" ? this.TentangModal : this.BantuanModal
    modal.classList.add("show")
    document.body.style.overflow = "hidden"
  }

  hideModal(type) {
    const modal = type === "Tentang" ? this.TentangModal : this.BantuanModal
    modal.classList.remove("show")
    document.body.style.overflow = "auto"
  }

  async sendMessage() {
    const message = this.userInput.value.trim()
    if (!message || this.isTyping) return

    this.addMessage(message, true)
    this.userInput.value = ""
    this.sendButton.disabled = true
    this.showTyping()

    this.conversationHistory.push({ role: "user", parts: [{ text: message }] })
    localStorage.setItem("conversationHistory", JSON.stringify(this.conversationHistory))

    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=AIzaSyD3STbqgdZouNjF8YrecoRVMX5ZzFO7B68", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ contents: this.conversationHistory })
      })

      const data = await response.json()
      const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Aku kena limit :("

      this.conversationHistory.push({ role: "model", parts: [{ text: botReply }] })
      localStorage.setItem("conversationHistory", JSON.stringify(this.conversationHistory))

      this.hideTyping()
      this.addMessage(botReply, false)
      this.sendButton.disabled = false

    } catch (error) {
      this.hideTyping()
      this.addMessage("Gagal koneksi ke Gemini API.", false)
      this.sendButton.disabled = false
    }
  }

  addMessage(text, isUser) {
    const messageDiv = document.createElement("div")
    messageDiv.className = `message ${isUser ? "user-message" : "bot-message"}`

    const avatarDiv = document.createElement("div")
    avatarDiv.className = `message-avatar ${isUser ? "user-avatar" : "bot-avatar"}`
    avatarDiv.innerHTML = `<i class="fas fa-${isUser ? "user" : "robot"}"></i>`

    const contentDiv = document.createElement("div")
    contentDiv.className = "message-content"

    const bubbleDiv = document.createElement("div")
    bubbleDiv.className = `message-bubble ${isUser ? "user-bubble" : "bot-bubble"}`

    const textP = document.createElement("p")
    textP.innerHTML = marked.parse(text)

    const timeSpan = document.createElement("span")
    timeSpan.className = "message-time"
    timeSpan.textContent = this.formatTime(new Date())

    bubbleDiv.appendChild(textP)
    bubbleDiv.appendChild(timeSpan)
    contentDiv.appendChild(bubbleDiv)
    messageDiv.appendChild(avatarDiv)
    messageDiv.appendChild(contentDiv)

    this.chatMessages.appendChild(messageDiv)
    this.scrollToBottom()

    this.messages.push({
      id: ++this.messageId,
      text,
      isUser,
      timestamp: new Date(),
    })
  }

  showTyping() {
    this.isTyping = true
    this.typingIndicator.style.display = "flex"
    this.scrollToBottom()
  }

  hideTyping() {
    this.isTyping = false
    this.typingIndicator.style.display = "none"
  }

  formatTime(date) {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  scrollToBottom() {
    setTimeout(() => {
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight
    }, 100)
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new AlcaAI()
})

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    const timeElements = document.querySelectorAll(".message-time")
    timeElements.forEach((element) => {})
  }
})

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "/") {
    e.preventDefault()
    document.getElementById("user-input").focus()
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault()
    document.getElementById("theme-toggle").click()
  }
})