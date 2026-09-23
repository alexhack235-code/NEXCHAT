# ==============================================================================
# NEXCHAT Mobile APK ProGuard & R8 Obfuscation Rules
# Protects against MT Manager, APKTool, and unauthorized decompilation.
# ==============================================================================

# 1. Bytecode Obfuscation & Repackaging
# Flattens packages and renames all classes and methods to short random identifiers (a, b, c)
-repackageclasses 'com.nexchat.app.obf'
-allowaccessmodification
-overloadaggressively
-useuniqueclassmembernames
-dontusemixedcaseclassnames

# 2. Optimization Settings
-optimizationpasses 5
-dontpreverify

# 3. Strip All Debug Logging (Anti-Logcat Sniffing)
# Prevents hackers from seeing auth tokens, API endpoints, and private URLs in logcat
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
    public static int w(...);
}

# 4. Capacitor & WebView JavaScript Bridge Protection
# Preserves bridge interfaces required for native device capabilities while obfuscating logic
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keepattributes JavascriptInterface

-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keep class com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }

# 5. Firebase Native SDK & Play Integrity Rules
-keepattributes EnclosingMethod,InnerClasses,Signature
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# 6. Keep Native Application Entry Point
-keep public class com.nexchat.app.MainActivity {
    public *;
}
