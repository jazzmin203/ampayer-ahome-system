import androidx.compose.foundation.layout.Column
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import com.example.ampayerapp.data.api.RetrofitInstance
import com.example.ampayerapp.data.api.UserDto
import com.example.ampayerapp.data.api.UserRequest
import kotlinx.coroutines.launch

@Composable
fun AmpayerDialog(
    token: String? = null, // JWT del admin (opcional)
    user: UserDto? = null,  // Si null -> crear, si tiene valor -> editar
    onDismiss: () -> Unit,
    onSaved: () -> Unit,
    onError: ((String) -> Unit)? = null
) {
    var username by remember { mutableStateOf(user?.username ?: "") }
    var email by remember { mutableStateOf(user?.email ?: "") }
    var firstName by remember { mutableStateOf(user?.first_name ?: "") }
    var lastName by remember { mutableStateOf(user?.last_name ?: "") }
    var password by remember { mutableStateOf("") }

    val scope = rememberCoroutineScope()
    val isEditing = user != null

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (user == null) "Crear Ampayer" else "Editar Ampayer") },
        text = {
            Column {
                OutlinedTextField(
                    value = username,
                    onValueChange = { username = it },
                    label = { Text("Username") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = firstName,
                    onValueChange = { firstName = it },
                    label = { Text("Nombre") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = lastName,
                    onValueChange = { lastName = it },
                    label = { Text("Apellido") },
                    singleLine = true
                )
                if (isEditing) {
                    // Estamos editando un usuario
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Nueva contraseña (opcional)") },
                        singleLine = true
                    )
                } else {
                    // Estamos creando un usuario nuevo
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Contraseña") },
                        singleLine = true
                    )
                }

            }
        },
        confirmButton = {
            Button(onClick = {
                if (username.isBlank() || email.isBlank() || firstName.isBlank() || lastName.isBlank() || (user == null && password.isBlank())) {
                    onError?.invoke("Completa todos los campos obligatorios")
                    return@Button
                }

                scope.launch {
                    try {
                        if (user == null) {
                            // CREAR USUARIO
                            val request = UserRequest(
                                username = username,
                                email = email,
                                first_name = firstName,
                                last_name = lastName,
                                password = password
                            )

                            val response = if (!token.isNullOrEmpty()) {
                                // Admin crea Ampayer
                                RetrofitInstance.api.createAmpayerByAdmin("Bearer $token", request)
                            } else {
                                // Autoregistro
                                RetrofitInstance.api.registerAmpayer(request)
                            }

                            if (response.isSuccessful) {
                                onSaved()
                            } else {
                                val errorText = response.errorBody()?.string() ?: "Error desconocido"
                                onError?.invoke("No se pudo crear Ampayer: $errorText")
                            }

                        } else {
                            // EDITAR USUARIO (solo Admin)
                            if (token.isNullOrEmpty()) {
                                onError?.invoke("Solo un admin puede editar usuarios")
                                return@launch
                            }

                            // 👇 Solo incluir la contraseña si se escribió
                            val updatedUser = if (password.isNotBlank()) {
                                user.copy(
                                    username = username,
                                    email = email,
                                    first_name = firstName,
                                    last_name = lastName,
                                    password = password
                                )
                            } else {
                                user.copy(
                                    username = username,
                                    email = email,
                                    first_name = firstName,
                                    last_name = lastName,
                                    password = null
                                )
                            }

                            val response = user.id?.let { id ->
                                RetrofitInstance.api.updateAmpayer(
                                    "Bearer $token",
                                    id,
                                    updatedUser
                                )
                            }

                            if (response != null) {
                                onSaved()
                            } else {
                                onError?.invoke("No se pudo actualizar el usuario")
                            }
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                        onError?.invoke("Error de conexión: ${e.message}")
                    }
                }
            }) { Text("Guardar") }
        },
        dismissButton = {
            Button(onClick = onDismiss) { Text("Cancelar") }
        }
    )
}