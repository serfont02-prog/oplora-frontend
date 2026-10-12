import { getOploUrl } from '@/lib/oplo';
import { CopaEnAvatar } from '@/components/liga/ligaUtils';

// ⭐ Muestra además la copa de la Liga Oplora (usuario.copaLiga) si la tiene.
// El contenedor no debe recortar (overflow visible) para que se vea la copa.
export function AvatarPerfil({ usuario, size = 44, conCopa = true }: { usuario: any; size?: number; conCopa?: boolean }) {
  const src = usuario?.tipoAvatar === 'foto' && usuario?.avatarUrl
    ? usuario.avatarUrl
    : getOploUrl(usuario?.oposicionActiva?.nivel ?? 1);

  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: size, height: size }}>
      <img src={src} alt="Avatar" style={{ width: size, height: size, objectFit: 'cover', borderRadius: '50%' }} />
      {conCopa && <CopaEnAvatar copa={usuario?.copaLiga} size={size} />}
    </span>
  );
}
