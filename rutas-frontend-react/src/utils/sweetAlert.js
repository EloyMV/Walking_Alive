import Swal from 'sweetalert2';

export function showErrorAlert(message) {
  return Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
    confirmButtonText: 'Aceptar'
  });
}

export function confirmAction({
  title,
  text,
  confirmButtonText = 'Confirmar'
}) {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  }).then((result) => result.isConfirmed);
}
