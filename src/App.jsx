import { useEffect, useMemo, useState } from 'react'
import { useLogin, useLogout, usePrivy } from '@privy-io/react-auth'
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

