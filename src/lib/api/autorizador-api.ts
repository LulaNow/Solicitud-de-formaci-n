/**
 * API para consultar el autorizador de un empleado
 */

export interface AutorizadorResponse {
  success: boolean;
  nombreCompleto?: string;
  correoElectronico?: string;
  idEmpleado?: string;
  nombrePuesto?: string;
  nombreDepartamento?: string;
  error?: string;
}

export async function getAutorizador(
  empresa: string,
  numEmpleado: string
): Promise<AutorizadorResponse> {
  try {
    const response = await fetch(
      `/api/autorizador?empresa=${encodeURIComponent(empresa)}&numEmpleado=${encodeURIComponent(numEmpleado)}`
    );

    if (!response.ok) {
      return {
        success: false,
        error: "Error al consultar autorizador",
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[API Autorizador] Error:", error);
    return {
      success: false,
      error: "Error de conexión al consultar autorizador",
    };
  }
}
