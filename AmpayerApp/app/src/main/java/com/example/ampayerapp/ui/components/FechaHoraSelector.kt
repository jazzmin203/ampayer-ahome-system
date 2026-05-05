import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import kotlin.time.ExperimentalTime
import java.time.Instant

// ---------- REEMPLAZAR BLOQUE DE FECHA/HORA POR ESTE ----------

@OptIn(ExperimentalMaterial3Api::class, ExperimentalTime::class)
@Composable
fun FechaHoraSelector(
    selectedDate: LocalDate,
    onDateChange: (LocalDate) -> Unit,
    selectedTime: LocalTime,
    onTimeChange: (LocalTime) -> Unit,
) {
    val dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")
    val timeFormatter = DateTimeFormatter.ofPattern("HH:mm")

    var showDatePicker by remember { mutableStateOf(false) }

    // Campos de texto editables para la hora
    var hourText by remember { mutableStateOf(selectedTime.hour.toString().padStart(2, '0')) }
    var minuteText by remember { mutableStateOf(selectedTime.minute.toString().padStart(2, '0')) }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        // --- Fecha ---
        OutlinedButton(
            onClick = { showDatePicker = true },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("📅 Fecha: ${selectedDate.format(dateFormatter)}")
        }

        if (showDatePicker) {
            val datePickerState = rememberDatePickerState(
                initialSelectedDateMillis = selectedDate.toEpochDay() * 24 * 60 * 60 * 1000
            )

            DatePickerDialog(
                onDismissRequest = { showDatePicker = false },
                confirmButton = {
                    TextButton(onClick = {
                        datePickerState.selectedDateMillis?.let {
                            val selected = Instant.ofEpochMilli(it)
                                .atZone(ZoneId.systemDefault())
                                .toLocalDate()
                            onDateChange(selected)
                        }
                        showDatePicker = false
                    }) {
                        Text("Aceptar")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDatePicker = false }) {
                        Text("Cancelar")
                    }
                }
            ) {
                DatePicker(state = datePickerState)
            }
        }

        // --- Hora editable ---
        OutlinedCard(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(12.dp)
            ) {
                Text("⏰ Hora del juego", style = MaterialTheme.typography.titleSmall)

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = hourText,
                        onValueChange = {
                            if (it.all { c -> c.isDigit() } && it.length <= 2) {
                                hourText = it
                                val hour = it.toIntOrNull() ?: selectedTime.hour
                                onTimeChange(
                                    LocalTime.of(hour.coerceIn(0, 23), selectedTime.minute)
                                )
                            }
                        },
                        label = { Text("Hora (0–23)") },
                        modifier = Modifier.weight(1f)
                    )

                    OutlinedTextField(
                        value = minuteText,
                        onValueChange = {
                            if (it.all { c -> c.isDigit() } && it.length <= 2) {
                                minuteText = it
                                val minute = it.toIntOrNull() ?: selectedTime.minute
                                onTimeChange(
                                    LocalTime.of(selectedTime.hour, minute.coerceIn(0, 59))
                                )
                            }
                        },
                        label = { Text("Minutos (0–59)") },
                        modifier = Modifier.weight(1f)
                    )
                }

                Text(
                    "Seleccionado: ${selectedTime.format(timeFormatter)}",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}
