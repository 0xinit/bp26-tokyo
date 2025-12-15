import { useEffect, useMemo, useState } from 'react'
import { useLogin, useLogout, usePrivy } from '@privy-io/react-auth'
import { createClient } from '@supabase/supabase-js'
import './App.css'

const STORAGE_KEY = 'tokyo-petition-signatures'
const seedSignatures = [
  {
    id: 'seed-1',
    name: 'Hina — Shibuya validator',
    proof: 'Solana wallet • 7gXK...fp9',
    timestamp: Date.now() - 4 * 60 * 1000,
  },
  {
    id: 'seed-2',
    name: 'Maya — DeFi dev',
    proof: 'Twitter • @defi_maya',
    timestamp: Date.now() - 16 * 60 * 1000,
  },
  {
    id: 'seed-3',
    name: 'Ken • NFT ops',
    proof: 'Phantom wallet • C8vw...9sj',
    timestamp: Date.now() - 40 * 60 * 1000,
  },
  {
    id: 'seed-4',
    name: 'Yuto — Breakpointer',
    proof: 'Twitter • @tokyobreak',
    timestamp: Date.now() - 90 * 60 * 1000,
  },
]

const shortenAddress = (address) =>
  address ? `${address.slice(0, 4)}...${address.slice(-4)}` : ''

const formatAgo = (timestamp) => {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes === 1) return '1 min ago'
  if (minutes < 60) return `${minutes} mins ago`
  const hours = Math.floor(minutes / 60)
  if (hours === 1) return '1 hour ago'
  if (hours < 24) return `${hours} hours ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? '1 day ago' : `${days} days ago`
}

const buildSignatureFromUser = (user) => {
  const wallet = user?.wallets?.[0] || user?.wallet
  const walletLabel =
    wallet?.chainType === 'solana' ? 'Solana wallet' : 'Wallet'
  const walletProof = wallet?.address
    ? `${walletLabel} • ${shortenAddress(wallet.address)}`
    : null
  const twitterHandle = user?.twitter?.username
  const displayName =
    user?.name ||
    (twitterHandle ? `@${twitterHandle}` : null) ||
    (wallet?.address ? shortenAddress(wallet.address) : null) ||
    'Privy user'

  return {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    userId: user?.id,
    name: displayName,
    proof: twitterHandle
      ? `Twitter • @${twitterHandle}`
      : walletProof || 'Privy verification',
    timestamp: Date.now(),
  }
}

function App({ appId }) {
  const { ready, authenticated, user } = usePrivy()
  const { login } = useLogin({
    onComplete: () => setFlash('Verified with Privy. Sign it!'),
    onError: (error) => {
      const message =
        error?.message?.toLowerCase().includes('twitter')
          ? 'Twitter login is disabled for this Privy app. Enable Twitter in the Privy dashboard.'
          : 'Login failed. Check Privy dashboard settings.'
      setFlash(message)
      console.error('Privy login error', error)
    },
  })
  const { logout } = useLogout()

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseKey) return null
    return createClient(supabaseUrl, supabaseKey)
  }, [supabaseUrl, supabaseKey])
  const remoteEnabled = Boolean(supabase)

  const [signatures, setSignatures] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (error) {
        console.warn('Failed to parse stored signatures', error)
      }
    }
    return seedSignatures
  })
  const [flash, setFlash] = useState('')
  const [showIntro, setShowIntro] = useState(true)
  const [loadingRemote, setLoadingRemote] = useState(remoteEnabled)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(signatures))
  }, [signatures])

  useEffect(() => {
    if (!flash) return
    const timer = setTimeout(() => setFlash(''), 3500)
    return () => clearTimeout(timer)
  }, [flash])

  useEffect(() => {
    if (!showIntro) return
    const timer = setTimeout(() => handleDismissIntro(), 7000)
    return () => clearTimeout(timer)
  }, [showIntro])

  useEffect(() => {
    if (!supabase) {
      setLoadingRemote(false)
      return
    }
    let cancelled = false
    const load = async () => {
      setLoadingRemote(true)
      const { data, error } = await supabase
        .from('signatures')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(120)
      if (cancelled) return
      if (error) {
        console.error('Supabase load error', error)
        setFlash('Failed to load remote signatures')
        setLoadingRemote(false)
        return
      }
      setSignatures(
        data.map((row) => ({
          id: row.id,
          userId: row.user_id || row.userId,
          name: row.name,
          proof: row.proof,
          timestamp: row.timestamp,
        })),
      )
      setLoadingRemote(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [supabase])

  const alreadySigned = useMemo(() => {
    if (!user) return false
    return signatures.some((entry) => entry.userId && entry.userId === user.id)
  }, [signatures, user])

  const handleDismissIntro = () => {
    setShowIntro(false)
  }

  const handleSign = async () => {
    if (!appId) {
      setFlash('Set VITE_PRIVY_APP_ID to enable Privy login')
      return
    }
    if (!ready) {
      setFlash('Booting Privy…')
      return
    }
    if (!authenticated) {
      login({
        loginMethods: ['wallet', 'twitter'],
        embeddedWallets: { createOnLogin: 'users-without-wallets' },
      })
      return
    }
    if (alreadySigned) {
      setFlash('You already signed this — arigatou!')
      return
    }
    const entry = buildSignatureFromUser(user)
    if (supabase) {
      const { error } = await supabase.from('signatures').insert({
        id: entry.id,
        user_id: entry.userId,
        name: entry.name,
        proof: entry.proof,
        timestamp: entry.timestamp,
      })
      if (error) {
        console.error('Supabase insert error', error)
        setFlash('Could not save to the shared petition')
        return
      }
      setSignatures((prev) => [entry, ...prev])
      setFlash('Saved to the shared petition — arigatou!')
    } else {
      setSignatures((prev) => [entry, ...prev])
      setFlash('Saved locally. Add Supabase to share it.')
    }
  }

  const signerCount = signatures.length
  const latestActivity = signatures.slice(0, 8)
  const statusText = !appId
    ? 'Add VITE_PRIVY_APP_ID to enable auth'
    : !ready
      ? 'Connecting to Privy…'
      : authenticated
        ? 'Verified via Privy'
        : 'Sign in with Twitter or a Solana wallet'

  const userProof = (() => {
    const wallet = user?.wallets?.[0] || user?.wallet
    if (user?.twitter?.username) return `@${user.twitter.username}`
    if (wallet?.address) return shortenAddress(wallet.address)
    return 'Not connected'
  })()

  return (
    <div className="page">
      <div className="bg" />
      <div className="grain" />
      <div className="solana-logo">
        <img src="/solanaLogo.svg" alt="Solana logo" />
      </div>

      {showIntro && (
        <div className="intro-overlay">
          <div className="intro-images">
            <img src="/tokyo.jpg" alt="Tokyo skyline" className="intro-frame intro-frame-1" />
            <img
              src="/tweet-splash.jpg"
              alt="BreakPoint tweet screenshot"
              className="intro-frame intro-frame-2"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
          <div className="intro-card">
            <span className="pill">Tokyo takeover</span>
            <h2>Loading the psyop</h2>
            <p>Mert said that Solana community is powerful and has the power to change the location of Breakpoint 2026, so here we are. Sign the petition if you want BP2026 in Japan.  </p>
            <div className="intro-actions">
              <button className="primary" onClick={handleDismissIntro}>
                Enter petition
              </button>
              <button className="ghost" onClick={handleDismissIntro}>
                Skip intro
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`content ${showIntro ? 'content-blur' : ''}`}>
        <header className="top">
          <div className="brand">
            <span className="pill">BreakPoint 2026</span>
            <p className="eyebrow">London? いいえ. We want Tokyo.</p>
          </div>
          <div className="counter">
            <span className="count">{signerCount}</span>
            <span className="count-label">voices for Tokyo</span>
          </div>
          <div className="status">
            <span className="dot" />
            {statusText}
          </div>
        </header>

        <div className="hero">
          <div className="headlines">
            <h1>
              Move BreakPoint
              <span>to Tokyo</span>
            </h1>
            <p className="lede">
              Sign to prove you are Solana-aligned or verified on Twitter. Every signature is
              a vote to bring BreakPoint 2026 to the city of culture and anime
            </p>
            <div className="chips">
              <span className="chip">Privy auth — Twitter & wallets</span>
              <span className="chip">Activity feed live</span>
              <span className="chip">
                {remoteEnabled ? 'Shared Supabase store' : 'Local demo storage'}
              </span>
            </div>
          </div>
          <div className="cta">
            <button className="primary" onClick={handleSign}>
              {authenticated ? 'Sign for Tokyo' : 'Verify & Sign'}
            </button>
            <div className="cta-meta">
              <p>
                {authenticated
                  ? `You’re connected as ${userProof}.`
                  : 'Prove yourself with Privy: Twitter or a Solana-compatible wallet.'}
              </p>
              {authenticated && (
                <button className="ghost" onClick={logout}>
                  Disconnect
                </button>
              )}
            </div>
            {flash && <div className="flash">{flash}</div>}
            {loadingRemote && remoteEnabled && <div className="flash">Syncing shared feed…</div>}
          </div>
        </div>

        <div className="grid">
          <section className="card petition">
            <div className="section-head">
              <div>
                <p className="eyebrow">Why Tokyo?</p>
                <h2>Builders, validators, and fans are here.</h2>
              </div>
              <div className="tiny-metric">
                <span className="tiny-label">Total Signed: </span>
                <strong>{signerCount}</strong>
              </div>
            </div>
            <ul className="reasons">
              <li>Asia-Pacific time zones bring new speakers & new users.</li>
              <li>Huge Solana hacker ecosystem already shipping weekly.</li>
              <li>Direct flights, ramen, and a skyline worthy of BreakPoint.</li>
            </ul>
            <div className="verification">
              <div>
                <p className="eyebrow">Proof stack</p>
                <h3>Twitter handles or Solana wallets via Privy</h3>
                <p className="body">
                  We use Privy to make sure each signer is a real supporter. Connect a Solana
                  wallet or your Twitter account — once verified, your name lights up the
                  activity feed.
                </p>
              </div>
              <button className="secondary" onClick={handleSign}>
                Add my name
              </button>
            </div>
          </section>

          <aside className="card activity">
            <div className="section-head">
              <p className="eyebrow">Live activity</p>
              <h3>Latest petitions</h3>
            </div>
            <ul className="activity-list">
              {latestActivity.map((entry) => (
                <li key={entry.id} className="activity-item">
                  <div className="avatar">{entry.name.slice(0, 1)}</div>
                  <div>
                    <p className="name">{entry.name}</p>
                    <p className="meta">
                      {entry.proof} • {formatAgo(entry.timestamp)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default App
