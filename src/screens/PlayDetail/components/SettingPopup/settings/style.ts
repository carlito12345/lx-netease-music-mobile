import { createStyle } from '@/utils/tools'

export default createStyle({
  container: {
    paddingTop: 8,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 12,
    alignItems: 'flex-start',
  },
  // title: {

  // },
  label: {
    width: 50,
    textAlign: 'center',
  },
  content: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  list: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 8,
    gap: 12,
  },
})
