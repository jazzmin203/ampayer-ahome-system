package com.example.ampayerapp.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Sección de formulario estandarizada para pantallas CRUD.
 * Aplica un estilo coherente con campos, títulos y botones.
 */
@Composable
fun FormSection(
    title: String,
    onSaveClick: (() -> Unit)? = null,
    onCancelClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge.copy(
                fontSize = 20.sp,
                fontWeight = FontWeight.SemiBold
            )
        )

        content()

        Row(
            horizontalArrangement = Arrangement.End,
            modifier = Modifier.fillMaxWidth()
        ) {
            if (onCancelClick != null) {
                OutlinedButton(
                    onClick = onCancelClick,
                    modifier = Modifier.padding(end = 8.dp)
                ) {
                    Text("Cancelar")
                }
            }
            if (onSaveClick != null) {
                Button(onClick = onSaveClick) {
                    Text("Guardar")
                }
            }
        }
    }
}
