import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'config.dart';
import 'screens/access_gate.dart';
import 'screens/login_screen.dart';
import 'state/inventory_store.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  GoogleFonts.config.allowRuntimeFetching = !kIsWeb;
  await initializeDateFormatting('es');

  if (AppConfig.useSupabaseAuth) {
    await Supabase.initialize(
      url: AppConfig.supabaseUrl,
      // ignore: deprecated_member_use — publishableKey aún no estable en todos los targets
      anonKey: AppConfig.supabaseAnonKey,
    );
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
      create: (_) => InventoryStore(),
      child: app,
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<AuthState>(
      stream: Supabase.instance.client.auth.onAuthStateChange,
      builder: (context, snapshot) {
        final user = Supabase.instance.client.auth.currentUser;
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
