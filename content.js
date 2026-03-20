chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'login') {
    const token = request.token
    const isLoginPage = window.location.pathname.includes('/login')

    const spamIframe = () => {
      try {
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        document.body.appendChild(iframe)
        const ls = iframe.contentWindow.localStorage
        ls.token = `"${token}"`
        ls.setItem('token', `"${token}"`)
        iframe.remove()
      } catch(e) {}
    }

    const pushWebpack = () => {
      if (!window.webpackChunkdiscord_app) return false
      try {
        window.webpackChunkdiscord_app.push([
          [Math.random()],
          {},
          req => {
            for (const id in req.c) {
              const mod = req.c[id]?.exports
              if (!mod) continue
              if (mod.Z?.setToken) { mod.Z.setToken(token); return true }
              if (mod.setToken) { mod.setToken(token); return true }
              if (mod.default?.setToken) { mod.default.setToken(token); return true }
              if (mod.loginToken) { mod.loginToken(token); return true }
              if (mod.setLoginToken) { mod.setLoginToken(token); return true }
            }
            return false
          }
        ])
        return true
      } catch(e) { return false }
    }

    if (isLoginPage) {
      // /login page = use iframe spam + auto redirect to /app
      spamIframe()
      const id = setInterval(spamIframe, 25)
      setTimeout(() => {
        clearInterval(id)
        window.location.href = 'https://discord.com/app'
      }, 800)
    } else {
      // /app or channels page = webpack + reload
      pushWebpack()
      const id = setInterval(() => {
        if (pushWebpack()) clearInterval(id)
      }, 40)

      setTimeout(() => {
        clearInterval(id)
        window.location.reload(true)
      }, 600)
      setTimeout(() => window.location.reload(true), 1000)
    }

    sendResponse({ success: true })
  }
  return true
})