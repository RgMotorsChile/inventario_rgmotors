class AppRelease {
  const AppRelease({
    required this.versionCode,
    required this.versionName,
    required this.downloadUrl,
    required this.forceUpdate,
    this.notes,
  });

  final int versionCode;
  final String versionName;
  final String downloadUrl;
  final bool forceUpdate;
  final String? notes;

  factory AppRelease.fromMap(Map<String, dynamic> map) {
    return AppRelease(
      versionCode: (map['version_code'] as num).toInt(),
      versionName: map['version_name'] as String,
      downloadUrl: map['download_url'] as String,
      forceUpdate: map['force_update'] as bool? ?? true,
      notes: map['notes'] as String?,
    );
  }
}

bool isNewerAppRelease(int currentCode, int latestCode) => latestCode > currentCode;
