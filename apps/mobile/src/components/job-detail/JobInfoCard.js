import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from "react-native";
import { Svg, Circle } from "react-native-svg";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import GlassCard from "../ui/GlassCard";

const JobInfoCard = ({ job }) => {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();

  if (!job) return null;

  const totalSteps = job.steps?.length || 0;
  const completedSteps = job.steps?.filter((s) => s.isCompleted).length || 0;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const handleNavigate = () => {
    if (!job.latitude || !job.longitude) return;
    
    const label = job.title || t('worker.jobLocation');
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${job.latitude},${job.longitude}`,
      android: `geo:0,0?q=${job.latitude},${job.longitude}(${label})`
    });

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to browser
        const browserUrl = `https://www.google.com/maps/search/?api=1&query=${job.latitude},${job.longitude}`;
        Linking.openURL(browserUrl);
      }
    });
  };

  // Helper for Circular Progress
  const renderCircularProgress = () => {
    const size = 60;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    const getColor = () => {
      if (progress === 100) return theme.colors.success || "#10B981";
      if (progress > 30) return theme.colors.primary || "#3b82f6";
      return "#f97316"; // orange-500
    };

    return (
      <View
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg
          width={size}
          height={size}
          style={{ transform: [{ rotate: "-90deg" }] }}
        >
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
          />
        </Svg>
        <View
          style={[
            StyleSheet.absoluteFill,
            { alignItems: "center", justifyContent: "center" },
          ]}
        >
          <Text style={{ textAlign: "center", color: theme.colors.text }}>
            <Text style={{ fontSize: size * 0.2, fontWeight: "bold" }}>
              {Math.round(progress)}%
            </Text>
            {"\n"}
            <Text style={{ fontSize: size * 0.14 }}>
              {completedSteps}/{totalSteps}
            </Text>
          </Text>
        </View>
      </View>
    );
  };

  return (
    <GlassCard style={styles.card} theme={theme}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.infoRow}>
            <MaterialIcons
              name="business"
              size={16}
              color={theme.colors.subText}
            />
            <Text style={[styles.infoText, { color: theme.colors.subText, fontWeight: 'bold' }]}>
              {job.customer?.company || job.customer?.name || t('jobs.customer')}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 8,
              marginTop: 4
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 10,
                  color: theme.colors.subText,
                  fontWeight: "bold",
                }}
              >
                {t('editJob.projectNo')}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "bold",
                  color: theme.colors.primary,
                }}
              >
                {job.jobNo || job.projectNo || t('worker.automatic')}
              </Text>
            </View>

            {job.projectNo && job.projectNo !== job.jobNo && (
              <View>
                <Text
                  style={{
                    fontSize: 10,
                    color: theme.colors.subText,
                    fontWeight: "bold",
                  }}
                >
                  REF NO
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "bold",
                    color: theme.colors.secondary || "#10b981",
                  }}
                >
                  {job.projectNo}
                </Text>
              </View>
            )}
            
            <View>
              <Text
                style={{
                  fontSize: 10,
                  color: theme.colors.subText,
                  fontWeight: "bold",
                }}
              >
                {t('common.recordId')}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "bold",
                  color: theme.colors.text,
                }}
              >
                #{job.id?.toString().slice(-6).toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={[styles.jobTitle, { color: theme.colors.text, marginTop: 4 }]}>
            {job.title}
          </Text>

          {job.latitude && job.longitude && (
            <TouchableOpacity 
              style={[styles.navigateButton, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]} 
              onPress={handleNavigate}
            >
              <MaterialIcons name="navigation" size={18} color={theme.colors.primary} />
              <Text style={[styles.navigateButtonText, { color: theme.colors.primary }]}>{t('common.getDirections')}</Text>
            </TouchableOpacity>
          )}

          <View style={{ marginTop: 8, padding: 8, backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: 8 }}>
            <Text style={{ fontSize: 10, color: theme.colors.subText, fontWeight: "bold", marginBottom: 4 }}>
              {t('worker.recordInfo')}
            </Text>
            <View style={styles.infoRow}>
              <MaterialIcons name="person" size={14} color={theme.colors.subText} />
              <Text style={{ fontSize: 12, color: theme.colors.text, marginLeft: 4 }}>
                {t('worker.createdBy', { name: job.creator?.name || t('worker.system') })}
              </Text>
            </View>
            <View style={[styles.infoRow, { marginBottom: 0 }]}>
              <MaterialIcons name="access-time" size={14} color={theme.colors.subText} />
              <Text style={{ fontSize: 12, color: theme.colors.text, marginLeft: 4 }}>
                {new Date(job.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>

          {(job.budget || job.estimatedDuration) && (
            <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
              {job.budget > 0 && (
                <View style={styles.infoRow}>
                  <MaterialIcons
                    name="attach-money"
                    size={16}
                    color={theme.colors.success || "#10B981"}
                  />
                  <Text
                    style={[
                      styles.infoText,
                      { color: theme.colors.text, fontWeight: "600" },
                    ]}
                  >
                    {job.budget?.toLocaleString("tr-TR", {
                      style: "currency",
                      currency: "TRY",
                    })}
                  </Text>
                </View>
              )}
              {job.estimatedDuration > 0 && (
                <View style={styles.infoRow}>
                  <MaterialIcons
                    name="timer"
                    size={16}
                    color={theme.colors.warning || "#F59E0B"}
                  />
                  <Text
                    style={[
                      styles.infoText,
                      { color: theme.colors.text, fontWeight: "600" },
                    ]}
                  >
                    {job.estimatedDuration} dk
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
        {totalSteps > 0 && renderCircularProgress()}
      </View>

      <View style={styles.separator} />

      <View style={styles.infoRow}>
        <MaterialIcons
          name="description"
          size={16}
          color={theme.colors.subText}
        />
        <Text style={[styles.description, { color: theme.colors.subText }]}>
          {job.description || t('worker.noDescription')}
        </Text>
      </View>

      {job.status === "IN_PROGRESS" && job.startedAt && totalSteps > 0 && (
        <View style={styles.estimationContainer}>
          <View style={styles.infoRow}>
            <MaterialIcons
              name="timer"
              size={16}
              color={theme.colors.primary}
            />
            <Text
              style={[
                styles.infoText,
                { color: theme.colors.text, fontWeight: "600" },
              ]}
            >
              {t('worker.estimatedFinish')}:{" "}
              {(() => {
                if (completedSteps === 0) return t('worker.estimating');
                const start = new Date(job.startedAt).getTime();
                const now = new Date().getTime();
                const elapsed = now - start;
                const progressRatio = completedSteps / totalSteps;
                const totalEst = elapsed / progressRatio;
                const finishDate = new Date(start + totalEst);
                return finishDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
              })()}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 10,
              color: theme.colors.subText,
              marginLeft: 24,
            }}
          >
            {t('worker.stepsCompletedCount', { completed: completedSteps, total: totalSteps })}
          </Text>
        </View>
      )}

      {(job.status === 'COMPLETED' || job.status === 'PENDING_APPROVAL') && (
        <View style={{ marginTop: 12, padding: 10, backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
            {job.startedAt && (
                <View style={[styles.infoRow, { marginBottom: 6 }]}>
                    <MaterialIcons name="play-circle-outline" size={16} color={theme.colors.subText} />
                    <Text style={{ fontSize: 13, color: theme.colors.text, marginLeft: 8, fontWeight: '500' }}>
                        {t('worker.started')}: <Text style={{ fontWeight: 'normal', color: theme.colors.subText }}>{new Date(job.startedAt).toLocaleString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                    </Text>
                </View>
            )}
            {job.completedDate && (
                <View style={[styles.infoRow, { marginBottom: 0 }]}>
                    <MaterialIcons name="check-circle" size={16} color={theme.colors.success || '#10b981'} />
                    <Text style={{ fontSize: 13, color: theme.colors.text, marginLeft: 8, fontWeight: '500' }}>
                        {t('worker.finished')}: <Text style={{ fontWeight: 'normal', color: theme.colors.subText }}>{new Date(job.completedDate).toLocaleString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                    </Text>
                </View>
            )}
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  estimationContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: 12,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 12,
    gap: 6
  },
  navigateButtonText: {
    fontSize: 13,
    fontWeight: 'bold'
  }
});

export default JobInfoCard;
