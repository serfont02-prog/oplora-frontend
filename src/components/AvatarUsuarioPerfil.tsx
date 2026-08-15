import { getOploUrl } from '@/lib/oplo';

export function AvatarPerfil({ usuario, size = 44 }: { usuario: any; size?: number }) {
  const src = usuario?.tipoAvatar === 'foto' && usuario?.avatarUrl
    ? usuario.avatarUrl
    : getOploUrl(usuario?.nivel ?? 1);

  return (
    <img src={src} alt="Avatar" style={{ width: size, height: size, objectFit: 'cover', borderRadius: '50%' }} />
  );
}