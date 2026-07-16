<?php

$finder = PhpCsFixer\Finder::create()
    ->in(__DIR__ . '/src')
    ->in(__DIR__ . '/tests')
    ->name('*.php')
    ->notName('*.blade.php')
    ->ignoreDotFiles(true)
    ->ignoreVCS(true);

return (new PhpCsFixer\Config())
    ->setRules([
        '@Symfony'                       => true,
        '@Symfony:risky'                 => false,
        '@PSR12'                         => true,
        'array_syntax'                   => ['syntax' => 'short'],
        'ordered_imports'                => ['sort_algorithm' => 'alpha'],
        'no_unused_imports'              => true,
        'not_operator_with_successor_space' => false,
        'trailing_comma_in_multiline'    => ['elements' => ['arrays']],
        'phpdoc_order'                   => true,
        'declare_strict_types'           => false,
        'global_namespace_import'        => ['import_classes' => true],
    ])
    ->setFinder($finder)
    ->setUsingCache(true)
    ->setCacheFile(__DIR__ . '/.php-cs-fixer.cache');