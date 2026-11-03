'use client';
import { useEffect, useState } from 'react';
import { get } from '@/lib/api';
import type { ApiKos } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const defaultAturanKos = `1. Dilarang merokok di dalam kamar dan area tertutup.
2. Tamu lawan jenis dilarang menginap, batas berkunjung hingga pukul 22.00 WIB.
3. Menjaga ketenangan dan kebersihan bersama pada pukul 23.00 - 06.00 WIB.
4. Hemat energi listrik & air, matikan AC/alat elektronik saat meninggalkan kamar.
5. Pembayaran tagihan sewa wajib diselesaikan paling lambat tanggal 5 setiap bulannya.`;

const mock: ApiKos[] = [{ id: 1, nama: 'Kos Melati Putri', alamat: 'Jl. Setiabudi Timur No. 12, Jakarta Selatan', kodePos: '12910', statusVerifikasi: 'TERVERIFIKASI', aturanKos: defaultAturanKos, tanggalJatuhTempo: 5, aturanDenda: { jenis: 'HARIAN', nominalPerHari: 10000, masaTenggang: 3, batasMaksimal: 100000, deskripsi: 'Denda harian' }, jumlahKamar: 15, kamarKosong: 3 }];

export function useKos() {
  const [kosList, setKosList] = useState<ApiKos[]>(useMock ? mock : []);
  const [kosId, setKosId] = useState<number | null>(useMock ? 1 : null);
  const [loaded, setLoaded] = useState(useMock);
  const [error, setError] = useState('');
  const muat = () => {
    if (useMock) return;
    setError('');
    get<ApiKos[]>('/api/kos').then(list => { setKosList(list); setKosId(prev => list.some(k => k.id === prev) ? prev : list[0]?.id ?? null); })
      .catch(e => setError(e instanceof Error ? e.message : 'Data kos belum berhasil dimuat.'))
      .finally(() => setLoaded(true));
  };
  const perbaruiDemo = (id: number, data: Partial<ApiKos>) => {
    if (useMock) setKosList(list => list.map(k => k.id === id ? { ...k, ...data } : k));
  };
  useEffect(muat, []);
  return { kosList, kosId, setKosId, kos: kosList.find(k => k.id === kosId) ?? null, loaded, error, muat, perbaruiDemo };
}
