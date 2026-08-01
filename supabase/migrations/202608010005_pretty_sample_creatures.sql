-- 초기에 자동 생성했던 도형 샘플을 기존 검수된 픽셀 에셋으로 교체한다.
update public.creatures set sprite = null, sprite_key = 'clownfish'
where author_nickname = '수족관지기' and name = '노을지느러미';

update public.creatures set sprite = null, sprite_key = 'tang'
where author_nickname = '수족관지기' and name = '파도콩';

update public.creatures set sprite = null, sprite_key = 'star'
where author_nickname = '수족관지기' and name = '소원별';

update public.creatures set sprite = null, sprite_key = 'jelly'
where author_nickname = '수족관지기' and name = '몽실해파리';

update public.creatures set sprite = null, sprite_key = 'kelp'
where author_nickname = '수족관지기' and name = '초록숨';
