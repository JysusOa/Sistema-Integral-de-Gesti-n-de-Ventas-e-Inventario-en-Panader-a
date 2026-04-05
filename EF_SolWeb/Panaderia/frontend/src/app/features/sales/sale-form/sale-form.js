// IIFE para encapsular el código y evitar contaminación global
(function() {
  'use strict'; // Modo estricto para mejores prácticas

  document.addEventListener('DOMContentLoaded', () => {
    try {
      const formContainer = document.querySelector('#saleForm'); // Selecciona el formulario por ID
      if (!formContainer) throw new Error('Elemento de formulario no encontrado.');

      // Función para agregar efectos de hover en campos de formulario
      function addHoverEffects() {
        formContainer.addEventListener('mouseover', (e) => {
          if (e.target.closest('.mat-form-field')) {
            e.target.closest('.mat-form-field').classList.add('hovered'); // Añade clase para efectos CSS
          }
        });

        formContainer.addEventListener('mouseout', (e) => {
          if (e.target.closest('.mat-form-field')) {
            e.target.closest('.mat-form-field').classList.remove('hovered'); // Remueve clase
          }
        });
      }

      // Función para validar el formulario antes de envío
      function handleFormValidation() {
        formContainer.addEventListener('submit', (e) => {
          e.preventDefault(); // Evita envío por defecto
          const isValid = validateForm(); // Llama a la función de validación
          if (isValid) {
            console.log('Formulario válido, procediendo a enviar...');
            // Aquí podrías integrar una llamada a un servicio Angular o API
            alert('Formulario enviado exitosamente!');
          } else {
            console.error('Formulario inválido. Corrige los errores.');
            showValidationErrors(); // Muestra errores en UI
          }
        });
      }

      // Función de validación personalizada (ejemplo simple; expándela según necesidades)
      function validateForm() {
        let isValid = true;
        const requiredFields = formContainer.querySelectorAll('input[required], select[required]');
        requiredFields.forEach(field => {
          if (!field.value.trim()) {
            isValid = false;
            field.classList.add('error'); // Añade clase para resaltar errores
          } else {
            field.classList.remove('error');
          }
        });
        return isValid;
      }

      // Función para mostrar errores en UI (puede integrarse con CSS para estilos)
      function showValidationErrors() {
        const errorFields = formContainer.querySelectorAll('.error');
        errorFields.forEach(field => {
          // Asume que hay un elemento hermano para mostrar mensajes
          const errorElement = field.nextElementSibling; // Ejemplo: mat-error
          if (errorElement && errorElement.classList.contains('mat-error')) {
            errorElement.style.display = 'block'; // Muestra el error
          }
        });
      }

      // Función para manejo responsivo
      function handleResponsiveDesign() {
        window.addEventListener('resize', () => {
          if (window.innerWidth < 768) {
            document.querySelectorAll('.second-row').forEach(row => {
              row.style.flexDirection = 'column'; // Cambia a columna en móvil
            });
          } else {
            document.querySelectorAll('.second-row').forEach(row => {
              row.style.flexDirection = 'row'; // Vuelve a fila en desktop
            });
          }
        });
      }

      // Función para manejar eventos en filas dinámicas (e.g., agregar/eliminar)
      function handleDynamicRows() {
        const addButton = document.querySelector('.add-button-row button');
        if (addButton) {
          addButton.addEventListener('click', () => {
            console.log('Fila agregada dinámicamente.');
            // Aquí podrías agregar lógica para crear nuevas filas via JS si es necesario
          });
        }

        const deleteButtons = document.querySelectorAll('.delete-btn-row');
        deleteButtons.forEach(button => {
          button.addEventListener('click', () => {
            console.log('Fila eliminada.');
            // Lógica para remover la fila padre
          });
        });
      }

      // Inicializa todas las funciones
      addHoverEffects();
      handleFormValidation();
      handleResponsiveDesign();
      handleDynamicRows();

    } catch (error) {
      console.error('Error al inicializar el script:', error.message);
      // Opcional: Mostrar un mensaje al usuario si hay un error crítico
    }
  });
})();
