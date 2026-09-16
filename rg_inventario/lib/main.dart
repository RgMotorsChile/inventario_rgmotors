import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:insforge_flutter/insforge_flutter.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';

import 'config.dart';
import 'screens/access_gate.dart';
import 'screens/login_screen.dart';
import 'services/web_http.dart';
import 'state/inventory_store.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  GoogleFonts.config.allowRuntimeFetching = !kIsWeb;
  await initializeDateFormatting('es');

  if (AppConfig.isConfigured) {
    await Insforge.initialize(
      url: AppConfig.insforgeUrl,
      anonKey: AppConfig.insforgeAnonKey,
    );
    silenceBrowserForbiddenHeaders();
  }

  runApp(const RgInventarioApp());
}

class RgInventarioApp extends StatelessWidget {
  const RgInventarioApp({super.key});

  @override
  Widget build(BuildContext context) {
    final app = MaterialApp(
      title: 'Inventario RG',
      debugShowCheckedModeBanner: false,
      theme: buildRgTheme(),
      locale: const Locale('es'),
      supportedLocales: const [Locale('es'), Locale('en')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: AppConfig.isConfigured ? const AuthGate() : const SetupScreen(),
    );

    if (!AppConfig.isConfigured) return app;

    return ChangeNotifierProvider(
      create: (_) => InventoryStore(Insforge.instance),
      child: app,
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<AuthState>(
      stream: Insforge.instance.auth.onAuthStateChange,
      builder: (context, snapshot) {
        final user = Insforge.instance.auth.currentUser;
        if (user == null) return const LoginScreen();
        return _AuthenticatedScope(userId: user.id);
      },
    );
  }
}

class _AuthenticatedScope extends StatefulWidget {
  const _AuthenticatedScope({required this.userId});
  final String userId;

  @override
  State<_AuthenticatedScope> createState() => _AuthenticatedScopeState();
}

class _AuthenticatedScopeState extends State<_AuthenticatedScope> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<InventoryStore>().start();
    });
  }

  @override
  void didUpdateWidget(covariant _AuthenticatedScope oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.userId != widget.userId) {
      context.read<InventoryStore>().start();
    }
  }

  @override
  Widget build(BuildContext context) => const RoleShell();
}
