package com.example.ampayerapp.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.example.ampayerapp.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AmpayerMenuScreen(
    navController: NavHostController,
    unreadNotifications: Int = 0,
    onLogout: () -> Unit
) {
    // 📋 Opciones del menú del ampayer
    val options = listOf(
        Triple("Mis asignaciones", AppDestinations.MY_ASSIGNMENTS, R.drawable.ic_assignments),
        Triple("Notificaciones", AppDestinations.NOTIFICATIONS, R.drawable.ic_notifications)
    )

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Menú Ampayer") },
                actions = {
                    IconButton(onClick = { onLogout() }) { // 👈 igual que AdminScreen
                        Icon(Icons.Default.ExitToApp, contentDescription = "Cerrar sesión")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            options.forEach { (title, route, icon) ->
                MenuButtonAmpayer(title, icon) {
                    navController.navigate(route)
                }

                // 🔔 Muestra badge si hay notificaciones sin leer
                if (title == "Notificaciones" && unreadNotifications > 0) {
                    Badge {
                        Text(unreadNotifications.toString())
                    }
                }
            }
        }
    }
}

@Composable
fun MenuButtonAmpayer(text: String, drawableRes: Int, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 4.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(16.dp)
        ) {
            Image(
                painter = painterResource(id = drawableRes),
                contentDescription = text,
                modifier = Modifier.size(40.dp)
            )
            Spacer(modifier = Modifier.width(16.dp))
            Text(text, style = MaterialTheme.typography.titleMedium)
        }
    }
}