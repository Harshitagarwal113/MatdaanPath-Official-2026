import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAnalytics,
  isSupported,
  logEvent,
  setAnalyticsCollectionEnabled,
  type Analytics,
} from "firebase/analytics";

type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

let analyticsPromise: Promise<Analytics | null> | null = null;

function hasFirebaseConfig(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId &&
      firebaseConfig.measurementId,
  );
}

function sanitizeAnalyticsParams(params?: AnalyticsParams): AnalyticsParams | undefined {
  if (!params) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  );
}

async function getClientAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined" || !hasFirebaseConfig()) {
    return null;
  }

  const firebaseSupported = await isSupported();
  if (!firebaseSupported) {
    return null;
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  setAnalyticsCollectionEnabled(analytics, true);
  return analytics;
}

export function isGoogleServicesConfigured(): boolean {
  return hasFirebaseConfig();
}

export async function trackUserAction(actionName: string, params?: AnalyticsParams): Promise<void> {
  analyticsPromise ??= getClientAnalytics();
  const analytics = await analyticsPromise;

  if (analytics) {
    logEvent(analytics, actionName, sanitizeAnalyticsParams(params));
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(`[Analytics disabled] ${actionName}`, params);
  }
}

export async function trackPageView(pathname: string): Promise<void> {
  await trackUserAction("page_view", {
    page_location: pathname,
    page_title: "MatdaanPath Home",
  });
}

export async function trackOutboundLink(url: string, label: string): Promise<void> {
  await trackUserAction("select_content", {
    content_type: "external_link",
    item_id: label,
    destination_url: url,
  });
}
