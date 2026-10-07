/*Crea un archivo nuevo en la raíz del proyecto, practica.ts (no lo vamos a subir a GitHub), y escribe:

Una interface Alumno con: id (número), nombre (texto), correo (texto) y semestre (número).
Un arreglo con 3 alumnos (inventados), con el tipo Alumno[].
Una función buscarPorSemestre(alumnos: Alumno[], semestre: number): Alumno[] que devuelva solo los alumnos de ese semestre.
Pista: los arreglos tienen .filter(), que funciona así:
*/
interface Alumno {
  id: number;
  nombre: string;
  correo: string;
  semestre: number;
}

const alumnos: Alumno[] = [
  { id: 1, nombre: "Juan Pérez", correo: "juan.perez@example.com", semestre: 5 },
  { id: 2, nombre: "María García", correo: "maria.garcia@example.com", semestre: 3 },
  { id: 3, nombre: "Carlos López", correo: "carlos.lopez@example.com", semestre: 5 }
];

function buscarPorSemestre(alumnos: Alumno[], semestre: number): Alumno[] {
  return alumnos.filter(alumno => alumno.semestre === semestre);
}

   console.log(buscarPorSemestre(alumnos, 5));