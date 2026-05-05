package com.example.ampayerapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import androidx.navigation.compose.rememberNavController
import com.example.ampayerapp.data.datastore.SessionManager
import com.example.ampayerapp.ui.screens.NavGraph

class MainActivity : ComponentActivity() {

    private lateinit var sessionManager: SessionManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Inicializamos el SessionManager
        sessionManager = SessionManager(this)

        setContent {
            AmpayerApp(sessionManager)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AmpayerApp(sessionManager: SessionManager) {
    val navController = rememberNavController()

    Scaffold(
        // Cada pantalla maneja su propio TopAppBar
        content = { paddingValues ->
            NavGraph(
                sessionManager = sessionManager,
                navController = navController,
                paddingValues = paddingValues
            )
        }
    )
}

@Preview(showBackground = true)
@Composable
fun PreviewAmpayerApp() {
    AmpayerApp(
        sessionManager = SessionManager(LocalContext.current)
    )
}
