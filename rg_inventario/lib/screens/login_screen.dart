import 'package:flutter/material.dart';
import 'package:insforge_flutter/insforge_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config.dart';
import '../services/errors.dart';
import '../theme.dart';
import '../widgets/widgets.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final email = TextEditingController();
  final password = TextEditingController();
  final name = TextEditingController();
  final invite = TextEditingController();
  bool register = false;
  bool busy = false;
  String? error;

  @override
  void dispose() {
    email.dispose();
    password.dispose();
    name.dispose();
    invite.dispose();
    super.dispose();
  }

  Future<void> _claimIfNeeded(String? code, String? fullName) async {
    final client = Insforge.instance;
    final pending = (code ?? '').trim().toUpperCase();
    if (pending.length >= 6) {
      await client.database.rpc('claim_invite', args: {
        'p_code': pending,
        'p_full_name': (fullName ?? '').trim().isEmpty ? 'Encargado bodega' : fullName!.trim(),
      }).execute();
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('pending_invite');
      return;
    }
    await client.database.rpc('ensure_profile', args: {
      'p_full_name': (fullName ?? '').trim().isEmpty ? null : fullName!.trim(),
    }).execute();
  }

  Future<void> _submit() async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final auth = Insforge.instance.auth;
      if (register) {
        if (invite.text.trim().length < 6) {
          throw Exception('Pide a jefatura un código de invitación.');
        }
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('pending_invite', invite.text.trim().toUpperCase());
        final result = await auth.signUp(
          email: email.text.trim(),
          password: password.text,
          name: name.text.trim().isEmpty ? 'Encargado bodega' : name.text.trim(),
        );
        if (!result.hasSession) {
          setState(() => error = 'Cuenta creada. Si pide confirmar correo, revísalo y luego entra.');
          return;
        }
        await _claimIfNeeded(invite.text, name.text);
      } else {
        await auth.signIn(
          email: email.text.trim(),
          password: password.text,
        );
        final prefs = await SharedPreferences.getInstance();
        final pending = prefs.getString('pending_invite');
        await _claimIfNeeded(pending, name.text);
      }
    } catch (e) {
      setState(() => error = friendlyError(e));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!AppConfig.isConfigured) {
      return const SetupScreen();
    }

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(-0.8, -1.1),
            radius: 1.2,
            colors: [Color(0x73173A79), RgColors.ink950],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 440),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 28, 24, 22),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const RgLogo(height: 78),
                        const SizedBox(height: 12),
                        const Text(
                          'BODEGA · PUERTO MONTT',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: RgColors.muted,
                            fontSize: 11,
                            letterSpacing: 2.2,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'APP DEL ENCARGADO',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Solo personal de bodega. Jefatura entra por la web. El primer acceso necesita código de invitación.',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: RgColors.muted, height: 1.45),
                        ),
                        const SizedBox(height: 22),
                        if (register)
                          TextField(
                            controller: name,
                            textCapitalization: TextCapitalization.words,
                            decoration: const InputDecoration(labelText: 'Nombre'),
                          ),
                        if (register) const SizedBox(height: 12),
                        if (register)
                          TextField(
                            controller: invite,
                            textCapitalization: TextCapitalization.characters,
                            decoration: const InputDecoration(
                              labelText: 'Código de invitación',
                              hintText: 'Lo entrega jefatura',
                            ),
                          ),
                        if (register) const SizedBox(height: 12),
                        TextField(
                          controller: email,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(labelText: 'Correo'),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: password,
                          obscureText: true,
                          decoration: const InputDecoration(labelText: 'Contraseña'),
                        ),
                        if (error != null) ...[
                          const SizedBox(height: 12),
                          Text(error!, style: const TextStyle(color: RgColors.red, fontSize: 13)),
                        ],
                        const SizedBox(height: 16),
                        FilledButton(
                          onPressed: busy ? null : _submit,
                          child: Text(busy
                              ? 'Entrando…'
                              : register
                                  ? 'Activar con código'
                                  : 'Entrar a bodega'),
                        ),
                        TextButton(
                          onPressed: () => setState(() => register = !register),
                          child: Text(
                            register ? 'Ya tengo cuenta' : 'Primera vez: tengo código',
                            style: const TextStyle(color: RgColors.brandLight),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class SetupScreen extends StatelessWidget {
  const SetupScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const RgLogo(height: 64),
              const SizedBox(height: 24),
              const SectionTitle(
                'CONECTAR INSFORGE',
                subtitle: 'Corre insforge/schema.sql, crea el primer usuario de jefatura en el dashboard y lanza la app con las claves.',
              ),
              const SizedBox(height: 12),
              const Text(
                'flutter run --dart-define=INSFORGE_URL=https://xxx.insforge.app --dart-define=INSFORGE_ANON_KEY=...',
                style: TextStyle(color: RgColors.brandLight, height: 1.5),
              ),
              const SizedBox(height: 16),
              const Text(
                'Esta app es solo para el encargado de bodega. Jefatura usa la versión web.',
                style: TextStyle(color: RgColors.muted, height: 1.5),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
