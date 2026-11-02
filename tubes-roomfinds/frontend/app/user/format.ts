const formatTanggalLengkap = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

export const tanggalLengkap = (value: string) => formatTanggalLengkap.format(new Date(`${value.slice(0, 10)}T00:00:00`));
