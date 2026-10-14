# -*- coding: utf-8 -*-
"""
FastAPI Router for NEXIUM AI Neurons & Synaptic Core.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List

try:
    from .engine import neural_engine
except ImportError:
    from neural_core.engine import neural_engine

router = APIRouter(prefix="/neural", tags=["neural_core"])

class FireSynapseRequest(BaseModel):
    stimulus: Optional[str] = Field(default=None, description="Input text or semantic token stream")
    stimulus_text: Optional[str] = Field(default=None, description="Alias for stimulus input text")
    stimulus_intensity: Optional[float] = Field(default=1.0)

@router.get("/status")
async def get_neural_status() -> Dict[str, Any]:
    """Returns neural mesh topology, layer count, and synaptic neuron firing status."""
    st = neural_engine.get_status()
    return {
        "status": "online",
        "network_topology": st,
        "engine": st.get("engine"),
    }

@router.post("/fire")
async def fire_neurons(req: FireSynapseRequest) -> Dict[str, Any]:
    """Triggers synaptic action potentials across multi-layer SwiGLU neurons."""
    text = req.stimulus or req.stimulus_text or "synaptic excitation"
    telemetry = neural_engine.fire_synapses(text)
    return {
        "status": "fired",
        "firing": telemetry,
        "telemetry": telemetry,
    }
