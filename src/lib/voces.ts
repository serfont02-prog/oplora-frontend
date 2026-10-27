// ⭐ Elección de voz para el audio de apuntes y artículos.
// Antes se buscaba "male" dentro del nombre de la voz, y "Female" también lo contiene: al pedir
// voz de hombre salía una de mujer. Además, en muchos móviles (Chrome en Android) las voces en
// español no indican el sexo en el nombre o solo hay voces de mujer. Ahora:
//  - se reconocen nombres habituales de voces masculinas y femeninas (Windows, macOS/iOS, Google...),
//  - se prefieren las voces de España (es-ES) sobre las de otros países,
//  - y si el dispositivo no tiene ninguna voz de hombre, se usa la disponible con un tono más
//    grave (pitch) para que se note el cambio.

const MASCULINAS = ['jorge', 'pablo', 'diego', 'carlos', 'juan', 'enrique', 'alvaro', 'álvaro', 'raul', 'raúl', 'sergio', 'miguel', 'jose', 'josé', 'antonio', 'andres', 'andrés', 'gonzalo', 'alonso', 'dario', 'darío', 'tomas', 'tomás', 'eddy', 'reed', 'rocko', 'grandpa', 'hombre', 'masculin'];
const FEMENINAS = ['monica', 'mónica', 'paulina', 'lucia', 'lucía', 'laura', 'maria', 'maría', 'helena', 'elvira', 'sabina', 'dalia', 'marisol', 'ximena', 'conchita', 'penelope', 'penélope', 'lupe', 'elena', 'paloma', 'esperanza', 'flo', 'sandy', 'shelley', 'grandma', 'mujer', 'femenin', 'female', 'woman'];

const sexoDeVoz = (v: SpeechSynthesisVoice): 'hombre' | 'mujer' | null => {
  const n = v.name.toLowerCase();
  if (/\bfemale\b|\bwoman\b/.test(n) || FEMENINAS.some((k) => n.includes(k))) return 'mujer';
  if (/\bmale\b|\bman\b/.test(n) || MASCULINAS.some((k) => n.includes(k))) return 'hombre';
  return null;
};

const prioridadIdioma = (v: SpeechSynthesisVoice) => (/^es[-_]ES/i.test(v.lang) ? 0 : /^es/i.test(v.lang) ? 1 : 2);

/** Voz y tono para el sexo pedido, entre las voces en español disponibles. */
export function elegirVoz(voces: SpeechSynthesisVoice[], genero: 'mujer' | 'hombre'): { voz: SpeechSynthesisVoice | null; pitch: number } {
  if (!voces.length) return { voz: null, pitch: genero === 'hombre' ? 0.7 : 1 };
  const ordenadas = [...voces].sort((a, b) => prioridadIdioma(a) - prioridadIdioma(b));
  const delSexo = ordenadas.find((v) => sexoDeVoz(v) === genero);
  if (delSexo) return { voz: delSexo, pitch: 1 };
  if (genero === 'mujer') {
    return { voz: ordenadas.find((v) => sexoDeVoz(v) !== 'hombre') ?? ordenadas[0], pitch: 1 };
  }
  // Sin voz de hombre en este dispositivo: la misma voz, más grave
  return { voz: ordenadas.find((v) => sexoDeVoz(v) !== 'mujer') ?? ordenadas[0], pitch: 0.7 };
}
