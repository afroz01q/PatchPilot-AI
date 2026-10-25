import asyncio
import os
import edge_tts

scenes = [
    (1, "Welcome to PatchPilot AI. In production systems, software bugs can be unpredictable and costly. PatchPilot AI provides a zero-dependency, local-first sandbox to break code, inspect deterministic test failures, generate targeted patches, and prove recovery with mathematical certainty."),
    (2, "At the heart of the platform is the 5-stage workflow pipeline: Inject bug, Run tests, Investigate root cause, Review patch, and Verify fix. Each stage advances sequentially, providing clear visibility into application state and regression barriers."),
    (3, "Let's simulate a bug. We select Scenario 1: Incorrect cart total. In calculateCartTotal, the discount calculation was written as a flat subtraction rather than scaling with the subtotal. The cart total immediately becomes corrupted from eighty-six dollars and forty cents to ninety-five dollars and ninety cents."),
    (4, "Triggering the local test runner executes three regression assertions in less than one millisecond. The test cart total applies percentage discount fails immediately with an exact mismatch: expected eighty-six forty, received ninety-five ninety. The failure is completely reproducible."),
    (5, "Clicking Investigate root cause triggers our deterministic diagnostic engine. It pinpoints calculateCartTotal, classifies the severity as High, and explains that the subtotal is being offset by a flat ten cents rather than a ten percent discount of nine dollars and sixty cents."),
    (6, "The Patch Review panel unlocks with an exact diff: removing the erroneous flat assignment and replacing it with discount equals subtotal times discountRate. Developers can inspect the rationale, reject if unsatisfactory, or approve the patch to stage the fix in memory."),
    (7, "Finally, clicking Verify Fix reruns the entire regression suite against the patched runtime. All three assertions turn green, the Demo Commerce app recalculates to the exact expected total of eighty-six dollars and forty cents, and the activity stream logs verified recovery.")
]

async def main():
    voice = "en-US-ChristopherNeural"
    os.makedirs("public/audio/scenes", exist_ok=True)
    for idx, text in scenes:
        out_path = f"public/audio/scenes/scene_{idx}.mp3"
        print(f"Generating real AI voice for Scene {idx}...")
        communicate = edge_tts.Communicate(text, voice, rate="+0%", pitch="+0Hz")
        await communicate.save(out_path)
        print(f"  -> Saved: {out_path} ({os.path.getsize(out_path)} bytes)")

if __name__ == "__main__":
    asyncio.run(main())
