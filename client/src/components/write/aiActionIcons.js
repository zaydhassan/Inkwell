import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import ReadMoreIcon from "@mui/icons-material/ReadMore";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import ShortTextIcon from "@mui/icons-material/ShortText";
import RateReviewIcon from "@mui/icons-material/RateReview";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import SegmentIcon from "@mui/icons-material/Segment";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CompressIcon from "@mui/icons-material/Compress";
import ExpandIcon from "@mui/icons-material/Expand";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import SpellcheckIcon from "@mui/icons-material/Spellcheck";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import FlagIcon from "@mui/icons-material/Flag";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import TitleIcon from "@mui/icons-material/Title";
import NotesIcon from "@mui/icons-material/Notes";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

/* Quick-action glyphs, keyed by AI_ACTIONS id. Kept in one place so the
   copilot grid and the text-selection menu can never drift apart. An id
   with no entry falls back to the sparkle — which is the whole point of
   the registry being extensible. */
export const AI_ACTION_ICONS = {
  improve: AutoFixHighIcon,
  continue: ReadMoreIcon,
  tone: RecordVoiceOverIcon,
  summarize: ShortTextIcon,
  challenge: RateReviewIcon,
  factcheck: FactCheckIcon,
  outline: SegmentIcon,
  research: ManageSearchIcon,
  rewrite: EditNoteIcon,
  shorter: CompressIcon,
  longer: ExpandIcon,
  simplify: LightbulbIcon,
  grammar: SpellcheckIcon,
  brainstorm: TipsAndUpdatesIcon,
  intro: FlagIcon,
  conclusion: SportsScoreIcon,
  headline: TitleIcon,
  excerpt: NotesIcon,
  explain: HelpOutlineIcon,
  ask: ChatBubbleOutlineIcon,
};

export const aiActionIcon = (id) => AI_ACTION_ICONS[id] || AutoAwesomeIcon;
