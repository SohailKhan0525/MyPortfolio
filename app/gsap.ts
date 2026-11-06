"use client";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
gsap.registerPlugin(ScrollTrigger, useGSAP);
// One ticker. Components revert only their own animation context.
export { gsap, ScrollTrigger, useGSAP };
