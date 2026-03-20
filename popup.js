document.addEventListener('DOMContentLoaded', () => {
  const tokenInput     = document.getElementById('tokenInput')
  const loginBtn       = document.getElementById('loginBtn')
  const saveBtn        = document.getElementById('saveBtn')
  const settingsBtn    = document.getElementById('settingsBtn')
  const statusEl       = document.getElementById('status')
  const savedTokensEl  = document.getElementById('savedTokens')
  const settingsModal  = document.getElementById('settingsModal')
  const autoSaveToggle = document.getElementById('autoSaveToggle')
  const modalClose     = document.getElementById('modalClose')

  let savedAccounts = []
  let autoSave = true

  chrome.storage.local.get(['savedAccounts', 'autoSave'], data => {
    savedAccounts = data.savedAccounts || []
    autoSave = data.autoSave !== false
    renderSavedAccounts()
    autoSaveToggle?.classList.toggle('on', autoSave)
  })

  function renderSavedAccounts() {
    if (!savedTokensEl) return
    savedTokensEl.innerHTML = ''
    if (savedAccounts.length === 0) {
      const empty = document.createElement('div')
      empty.style.textAlign = 'center'
      empty.style.padding = '30px 10px'
      empty.style.color = '#72767d'
      empty.style.fontSize = '13px'
      empty.textContent = 'No saved accounts yet'
      savedTokensEl.appendChild(empty)
      return
    }
    savedAccounts.forEach((acc, index) => {
      const item = document.createElement('div')
      item.className = 'token-item'
      item.innerHTML = `
        <img class="pfp" src="${acc.pfp}" alt="pfp">
        <div class="info">
          <div class="username">${acc.username}</div>
          <div class="token-preview">${acc.token.substring(0, 35)}...</div>
        </div>
        <div class="actions">
          <button class="login-btn" data-index="${index}">LOGIN</button>
          <button class="delete-btn" data-index="${index}">DELETE</button>
        </div>
      `
      savedTokensEl.appendChild(item)
    })
  }

  function setStatus(color, text) {
    if (statusEl) {
      statusEl.style.color = color
      statusEl.textContent = text
    }
  }

  function tryLogin(token) {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tab = tabs[0]
      if (!tab || !tab.url?.includes('discord.com')) {
        setStatus('#f04747', 'open https://discord.com/app first dumbass')
        return
      }

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }, () => {
        if (chrome.runtime.lastError) {
          setStatus('#f04747', 'Cannot inject content script: ' + chrome.runtime.lastError.message)
          return
        }

        chrome.tabs.sendMessage(tab.id, { action: 'login', token }, response => {
          if (chrome.runtime.lastError) {
            setStatus('#f04747', 'Content script not loaded – reload the Discord tab or extension')
            return
          }

          if (response?.success) {
            fetch('https://discord.com/api/v10/users/@me', {
              headers: { 'Authorization': token }
            })
            .then(res => {
              if (!res.ok) {
                throw new Error('invalid or expired token')
              }
              return res.json()
            })
            .then(user => {
              const displayName = user.global_name || user.username || 'retard'
              const discrim = user.discriminator || '0000'
              const fullName = user.global_name ? displayName : `${displayName}#${discrim}`

              const account = {
                token: token,
                username: fullName,
                pfp: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=80` : 'https://cdn.discordapp.com/embed/avatars/0.png'
              }

              if (!savedAccounts.some(a => a.token === token)) {
                savedAccounts.unshift(account)
                if (savedAccounts.length > 15) savedAccounts.pop()
                chrome.storage.local.set({ savedAccounts })
                renderSavedAccounts()
              }

              setStatus('#43b581', `✅ logged in as a retard: ${fullName}`)
            })
            .catch(() => {
              setStatus('#f04747', '❌ token expired or invalid retard get a new one 🙏😭')
            })
          } else {
            setStatus('#f04747', '❌ broski get some new tokens the login fucking failed 🙏😭')
          }
        })
      })
    })
  }

  loginBtn?.addEventListener('click', () => {
    let token = tokenInput?.value?.trim()
    if (!token) {
      setStatus('#f04747', 'Please paste a token')
      return
    }
    if (token.startsWith('"') && token.endsWith('"')) token = token.slice(1, -1)

    setStatus('#fff', 'Injecting token...')
    tryLogin(token)
  })

  savedTokensEl?.addEventListener('click', e => {
    const btn = e.target
    if (!btn?.dataset?.index) return
    const index = Number(btn.dataset.index)
    const acc = savedAccounts[index]
    if (!acc) return

    if (btn.classList.contains('login-btn')) {
      setStatus('#fff', `Logging into ${acc.username}...`)
      tryLogin(acc.token)
    }

    if (btn.classList.contains('delete-btn')) {
      savedAccounts.splice(index, 1)
      chrome.storage.local.set({ savedAccounts })
      renderSavedAccounts()
    }
  })

  saveBtn?.addEventListener('click', () => {
    setStatus('#f0b400', 'brotato use "login with token" first')
  })

  settingsBtn?.addEventListener('click', () => {
    if (settingsModal) settingsModal.style.display = 'block'
  })

  modalClose?.addEventListener('click', () => {
    if (settingsModal) settingsModal.style.display = 'none'
  })

  autoSaveToggle?.addEventListener('click', () => {
    autoSave = !autoSave
    chrome.storage.local.set({ autoSave })
    autoSaveToggle?.classList.toggle('on', autoSave)
  })
})
console.log()
