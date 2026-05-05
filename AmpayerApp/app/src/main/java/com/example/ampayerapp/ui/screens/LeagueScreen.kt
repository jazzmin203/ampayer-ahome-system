package com.example.ampayerapp.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.ampayerapp.data.api.League
import com.example.ampayerapp.data.api.RetrofitInstance
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable
fun LeagueScreen(
    token: String,
    ampayerId: Int, // ID del ampayer para filtrar si fuera necesario
    onLeagueSelected: (Int) -> Unit
) {
    var leagues by remember { mutableStateOf<List<League>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var snackbarMessage by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    // Cargar ligas
    LaunchedEffect(token) {
        if (token.isBlank()) {
            snackbarMessage = "Token no disponible"
            isLoading = false
            return@LaunchedEffect
        }

        try {
            isLoading = true
            leagues = withContext(Dispatchers.IO) {
                // Aquí puedes filtrar ligas por ampayerId si tu API lo soporta
                RetrofitInstance.api.getLeagues("Bearer $token")
            }
        } catch (e: Exception) {
            snackbarMessage = "Error al cargar ligas: ${e.message}"
        } finally {
            isLoading = false
        }
    }

    Scaffold { padding ->
        Box(modifier = Modifier
            .fillMaxSize()
            .padding(padding)
        ) {
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            } else {
                if (leagues.isEmpty()) {
                    Text(
                        "No hay ligas asignadas",
                        modifier = Modifier.align(Alignment.Center)
                    )
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(leagues) { league ->
                            // league.id puede ser null, usamos ?: 0 para seguridad
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { onLeagueSelected(league.id ?: 0) }
                                    .padding(4.dp)
                            ) {
                                Text(
                                    league.name,
                                    modifier = Modifier.padding(16.dp),
                                    style = MaterialTheme.typography.titleMedium
                                )
                            }
                        }
                    }
                }
            }

            // Snackbar
            snackbarMessage?.let { msg ->
                Snackbar(
                    modifier = Modifier
                        .padding(16.dp)
                        .align(Alignment.BottomCenter)
                ) {
                    Text(msg)
                }
            }
        }
    }
}
