"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowDown, ArrowUpRight, Briefcase, Code, GithubLogo, LinkedinLogo, List, Moon, PaperPlaneTilt, Sparkle, Sun, X } from "@phosphor-icons/react";

type Theme = "light" | "dark";
type Contribution = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };
