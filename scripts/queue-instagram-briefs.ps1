$headers = @{
    "x-marketing-key" = "753b363687e8c3e2b9d296408cf0e076593fb40e92825f098663d891c4cfefca"
    "Content-Type" = "application/json"
}
$uri = "https://vikinglabs.co/api/marketing/content"

$briefs = @(
    @{
        platform = "instagram"
        format = "carousel_education"
        topic = "peptide_purity_testing"
        hook = "Not all peptides are created equal. Here's how labs actually verify purity before anything hits a shelf."
        script = @(
            "Step one: HPLC analysis. High-Performance Liquid Chromatography separates compounds to reveal exactly what's in a sample.",
            "Step two: Mass spectrometry confirms molecular weight. If the mass doesn't match the target peptide, it's flagged immediately.",
            "Step three: Amino acid analysis verifies the sequence is correct, residue by residue.",
            "Step four: Endotoxin testing ensures no bacterial contamination slipped through synthesis.",
            "At Viking Labs, every batch goes through all four steps. No shortcuts. No exceptions."
        )
        caption = "Quality isn't a buzzword - it's a process. Every Viking Labs peptide passes 4-stage purity verification before release. Swipe to see the science behind the standard."
        hashtags = @("#PeptidePurity", "#QualityControl", "#HPLC", "#MassSpectrometry", "#LabScience", "#PeptideResearch", "#BiochemistryNerd", "#ScienceCommunication", "#VikingLabs", "#ResearchGrade", "#LabTesting", "#PurityMatters")
        cta = "Save this for reference + follow for more lab science"
        compliance = @{ risk_score = 0; flags = @(); notes = "Educational content about lab testing methodology - no health claims" }
    },
    @{
        platform = "instagram"
        format = "reel_educational"
        topic = "bpc157_research_overview"
        hook = "BPC-157 is one of the most studied peptides in regenerative research. Here's what the science actually says."
        script = @(
            "BPC-157 stands for Body Protection Compound. It's a partial sequence of a protein found in human gastric juice.",
            "Over 100 published studies have examined its effects on tissue repair in animal models.",
            "Research shows it may accelerate healing of tendons, ligaments, and muscle tissue in preclinical trials.",
            "It's also being studied for its potential effects on gut lining integrity and blood vessel formation.",
            "Important: This is research-grade material for scientific study. Always consult published literature before drawing conclusions."
        )
        caption = "BPC-157: one of the most researched peptides in regenerative science. Here's the 60-second breakdown of what 100+ studies have found. Link in bio for full research library."
        hashtags = @("#BPC157", "#PeptideResearch", "#RegenerativeMedicine", "#Biochemistry", "#ScienceExplained", "#ResearchPeptides", "#TissueRepair", "#MolecularBiology", "#VikingLabs", "#PeptideScience", "#ClinicalResearch", "#LabLife")
        cta = "Follow for weekly research breakdowns"
        compliance = @{ risk_score = 0.2; flags = @("research_only_disclaimer"); notes = "Includes research-only disclaimer. All claims reference published preclinical studies." }
    },
    @{
        platform = "instagram"
        format = "static_infographic"
        topic = "cold_chain_shipping"
        hook = "Your peptides traveled 2,000 miles. Here's how we make sure they arrive as pure as when they left the lab."
        script = @(
            "Peptides degrade with heat exposure. That's why cold chain logistics aren't optional - they're essential.",
            "Every Viking Labs shipment uses insulated packaging with gel ice packs rated for 72+ hours.",
            "Temperature monitors inside the package verify the cold chain was maintained throughout transit.",
            "Upon arrival, peptides should be stored at -20C for long-term or 2-8C for short-term use.",
            "We don't just sell peptides. We engineer the entire journey from synthesis to your freezer."
        )
        caption = "From lab to your door: the cold chain matters. Here's why we obsess over shipping logistics as much as synthesis quality."
        hashtags = @("#ColdChain", "#PeptideShipping", "#QualityAssurance", "#LabLogistics", "#PeptideStorage", "#ResearchSupply", "#VikingLabs", "#ScienceMatters", "#SupplyChain", "#ResearchGrade", "#LabSupplies", "#PeptideCare")
        cta = "Tag a researcher who needs to see this"
        compliance = @{ risk_score = 0; flags = @(); notes = "Logistics and storage education - no health claims" }
    },
    @{
        platform = "instagram"
        format = "reel_storytelling"
        topic = "viking_labs_origin_story"
        hook = "We started Viking Labs because we were tired of the peptide industry cutting corners. This is our story."
        script = @(
            "The peptide research market had a problem: inconsistent purity, questionable sourcing, and zero transparency.",
            "We asked ourselves: what if a company actually prioritized researchers over profit margins?",
            "So we built Viking Labs from the ground up with one rule: never compromise on quality.",
            "Every batch tested. Every certificate of analysis published. Every customer treated like a fellow scientist.",
            "This isn't just a business. It's a mission to make research-grade peptides accessible and trustworthy."
        )
        caption = "Why Viking Labs exists: because researchers deserve better. Our founding story, in 60 seconds. Drop a comment if you've ever been burned by low-quality research supplies."
        hashtags = @("#VikingLabs", "#FounderStory", "#PeptideCompany", "#ResearchGrade", "#QualityFirst", "#LabLife", "#StartupStory", "#PeptideResearch", "#Transparency", "#ScienceCommunity", "#Entrepreneurship", "#BrandStory")
        cta = "Share your lab supply horror stories in comments"
        compliance = @{ risk_score = 0.1; flags = @(); notes = "Brand storytelling - no specific health claims, focuses on quality commitment" }
    },
    @{
        platform = "instagram"
        format = "carousel_education"
        topic = "peptide_vs_protein_difference"
        hook = "Peptides and proteins are NOT the same thing. Here's the real difference and why it matters for research."
        script = @(
            "Both peptides and proteins are chains of amino acids. The difference? Size and complexity.",
            "Peptides: typically 2-50 amino acids. Small, targeted, and often used as signaling molecules.",
            "Proteins: 50+ amino acids, folded into complex 3D structures. They're the machinery of your cells.",
            "Why it matters: peptides are easier to synthesize, more stable in solution, and can target specific receptors.",
            "This is why peptide research is exploding - they offer precision that larger proteins can't match."
        )
        caption = "Peptide vs Protein: know the difference. This fundamental distinction drives everything in modern biochemistry research. Swipe through for the breakdown."
        hashtags = @("#PeptideVsProtein", "#Biochemistry", "#MolecularBiology", "#AminoAcids", "#ProteinScience", "#PeptideResearch", "#ScienceEducation", "#LabScience", "#VikingLabs", "#BiologyBasics", "#ResearchEducation", "#CellBiology")
        cta = "Save and share with your study group"
        compliance = @{ risk_score = 0; flags = @(); notes = "Pure educational content - biochemistry fundamentals" }
    },
    @{
        platform = "instagram"
        format = "reel_educational"
        topic = "reconstitution_guide"
        hook = "Reconstituting peptides wrong ruins your entire experiment. Here's the protocol every researcher needs to know."
        script = @(
            "Rule one: Use bacteriostatic water or sterile water depending on your protocol. Never tap water.",
            "Rule two: Add the solvent slowly down the side of the vial. Don't inject directly onto the lyophilized powder.",
            "Rule three: Gently swirl - never shake. Vigorous agitation can denature the peptide structure.",
            "Rule four: Allow 5-10 minutes for full dissolution. Patience here saves your entire experiment.",
            "Rule five: Store reconstituted peptides at 2-8C and use within the timeframe specified for your compound."
        )
        caption = "The 5 rules of peptide reconstitution that every researcher needs pinned. Bad technique = wasted compound and unreliable data. Save this guide."
        hashtags = @("#PeptideReconstitution", "#LabProtocol", "#ResearchTips", "#LabTechnique", "#PeptidePrep", "#ScienceTips", "#VikingLabs", "#LabLife", "#ResearchGrade", "#Biochemistry", "#LabSkills", "#ScienceEducation")
        cta = "Save this protocol and share with your lab team"
        compliance = @{ risk_score = 0; flags = @(); notes = "Lab protocol education - standard reconstitution procedure" }
    }
)

$results = @()
foreach ($brief in $briefs) {
    $body = $brief | ConvertTo-Json -Depth 4
    try {
        $resp = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body
        $results += "OK: $($resp.id) - $($brief.topic)"
        Write-Host "Queued: $($brief.topic) -> $($resp.id)"
    } catch {
        $results += "FAIL: $($brief.topic) - $_"
        Write-Host "FAILED: $($brief.topic) - $_"
    }
}

Write-Host "`n--- RESULTS ---"
$results | ForEach-Object { Write-Host $_ }
