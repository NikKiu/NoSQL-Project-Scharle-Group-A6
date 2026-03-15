import type { Sportler, Training, TimeSeries } from '../types'

export async function getUsers() {
  const res = await fetch('/mock/users.json')
  return res.json()
}

export async function getSportler(id: string): Promise<Sportler | undefined> {
  const res = await fetch('/mock/athletes.json')
  const arr: Sportler[] = await res.json()
  return arr.find(a => a.id === id)
}

export async function getSportlersByIds(ids: string[]): Promise<Sportler[]> {
  const res = await fetch('/mock/athletes.json')
  const arr: Sportler[] = await res.json()
  return arr.filter((a) => (a.id ? ids.includes(a.id) : false))
}

export async function getTrainingsBySportler(sportlerId: string): Promise<Training[]> {
  const res = await fetch('/mock/trainings.json')
  const arr: Training[] = await res.json()
  return arr.filter(t => t.athleteId === sportlerId).sort((a,b)=> (b.startTs.localeCompare(a.startTs)))
}

export async function getTimeSeries(sportlerId: string, trainingId: string): Promise<TimeSeries> {
  const res = await fetch(`/mock/timeseries_${sportlerId}_${trainingId}.json`)
  return res.json()
}
